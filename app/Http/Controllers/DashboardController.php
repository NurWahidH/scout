<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia; 
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Statistik
        $stats = [
            'total_prospects' => Prospect::count(),
            'processed'       => Prospect::has('latestScore')->count(),
            'high_priority'   => Prospect::whereHas('latestScore', function ($q) {
                                    $q->where('priority', 1);
                                })->count(),
        ];

        // 2. Ambil data & Format ulang
        $prospects = Prospect::with(['status', 'latestScore'])
            ->orderByDesc('id')
            ->paginate(50)
            ->through(function ($item) {
                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
                    
                    // Score & Priority
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    
                    'scored_at'      => $item->latestScore 
                                        ? Carbon::parse($item->latestScore->created_at)->format('d M Y H:i') 
                                        : null,

                    // Data editable
                    'age'            => $item->age,
                    'job'            => $item->job,
                    'education'      => $item->education,
                    'month'          => $item->month,
                    'duration'       => $item->duration,
                    'campaign'       => $item->campaign,
                    'poutcome'       => $item->poutcome,
                    'cons_price_idx' => $item->cons_price_idx,
                    'cons_conf_idx'  => $item->cons_conf_idx,
                    'euribor3m'      => $item->euribor3m,
                    'nr_employed'    => $item->nr_employed,
                ];
            });

        return Inertia::render('Dashboard', [
            'stats'     => $stats,
            'prospects' => $prospects,
        ]);
    }

    // --- FITUR TAMBAH MANUAL (BARU) ---
    public function store(Request $request)
    {
        // Validasi input
        $validated = $request->validate([
            'age'            => 'required|numeric',
            'job'            => 'required|string',
            'education'      => 'required|string',
            'month'          => 'required|string',
            'duration'       => 'required|numeric',
            'campaign'       => 'required|numeric',
            'poutcome'       => 'required|string',
            'cons_price_idx' => 'required|numeric',
            'cons_conf_idx'  => 'required|numeric',
            'euribor3m'      => 'required|numeric',
            'nr_employed'    => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            // Ambil status default 'NEW'
            $defaultStatus = ProspectStatus::firstOrCreate(
                ['status_code' => 'NEW'],
                ['status_type' => 'open']
            );

            // Tambah field meta
            $validated['prospect_status_id'] = $defaultStatus->id;
            $validated['created_by_user_id'] = auth()->id();

            // Simpan Data
            Prospect::create($validated);

            DB::commit();
            return back()->with('success', 'Data prospek berhasil ditambahkan secara manual.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan: ' . $e->getMessage());
        }
    }

    // --- FITUR UPDATE DATA ---
    public function update(Request $request, $id)
    {
        // Validasi input editable
        $validated = $request->validate([
            'age'            => 'numeric|nullable',
            'job'            => 'string|nullable',
            'education'      => 'string|nullable',
            'month'          => 'string|nullable',
            'duration'       => 'numeric|nullable',
            'campaign'       => 'numeric|nullable',
            'poutcome'       => 'string|nullable',
            'cons_price_idx' => 'numeric|nullable',
            'cons_conf_idx'  => 'numeric|nullable',
            'euribor3m'      => 'numeric|nullable',
            'nr_employed'    => 'numeric|nullable',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            
            // 1. Update Data Prospek
            $prospect->update($validated);

            // 2. HAPUS HASIL PREDIKSI LAMA (PENTING)
            // Karena data berubah, prediksi lama tidak valid lagi.
            $prospect->scores()->delete();

            DB::commit();
            return back()->with('success', 'Data diperbarui. Score & Priority di-reset karena data berubah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal update: ' . $e->getMessage());
        }
    }

    // --- FITUR IMPORT CSV ---
    public function import(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt',
        ]);

        try {
            $file = $request->file('csv_file');
            $path = $file->getRealPath();

            $handle    = fopen($path, 'r');
            $firstLine = fgets($handle);
            fclose($handle);

            $delimiter = ';';
            if (substr_count($firstLine, ',') > substr_count($firstLine, ';')) {
                $delimiter = ',';
            }

            $csv = array_map(function ($line) use ($delimiter) {
                return str_getcsv($line, $delimiter);
            }, file($path));

            if (empty($csv)) return back()->with('error', 'File CSV kosong.');

            $header = array_map(function ($col) {
                return strtolower(trim($col));
            }, array_shift($csv));

            $columnMapping = [
                'age'            => 'age',
                'job'            => 'job',
                'education'      => 'education',
                'month'          => 'month',
                'duration'       => 'duration',
                'campaign'       => 'campaign',
                'poutcome'       => 'poutcome',
                'cons.price.idx' => 'cons_price_idx',
                'cons_price_idx' => 'cons_price_idx',
                'cons.conf.idx'  => 'cons_conf_idx',
                'cons_conf_idx'  => 'cons_conf_idx',
                'euribor3m'      => 'euribor3m',
                'nr.employed'    => 'nr_employed',
                'nr_employed'    => 'nr_employed',
            ];

            $headerIndexes = [];
            foreach ($header as $index => $columnName) {
                if (isset($columnMapping[$columnName])) {
                    $dbColumn = $columnMapping[$columnName];
                    $headerIndexes[$dbColumn] = $index;
                }
            }

            if (empty($headerIndexes)) return back()->with('error', 'Format CSV tidak sesuai.');

            $defaultStatus = ProspectStatus::firstOrCreate(
                ['status_code' => 'NEW'],
                ['status_type' => 'open']
            );

            $imported = 0;
            $skipped  = 0;

            DB::beginTransaction();

            foreach ($csv as $rowNum => $row) {
                if (empty(array_filter($row))) continue;

                $data = [];
                foreach ($headerIndexes as $dbColumn => $csvIndex) {
                    if (array_key_exists($csvIndex, $row)) {
                        $value = trim($row[$csvIndex]);
                        $data[$dbColumn] = ($value === '' || strtolower($value) === 'unknown') ? null : $value;
                    }
                }

                $nonNullValues = array_filter($data, fn($v) => !is_null($v));
                if (empty($nonNullValues)) {
                    $skipped++;
                    continue;
                }

                $data['prospect_status_id'] = $defaultStatus->id;
                $data['created_by_user_id'] = auth()->id() ?? null;

                try {
                    Prospect::create($data);
                    $imported++;
                } catch (\Exception $e) {
                    $skipped++;
                }
            }

            DB::commit();
            return back()->with('success', "Import selesai: {$imported} sukses, {$skipped} skip.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal import: ' . $e->getMessage());
        }
    }

    // --- FITUR PREDIKSI BATCH ---
    public function runPredictions(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        set_time_limit(300); 

        $featureColumns = [
            'age', 'job', 'education', 'month', 'duration', 'campaign',
            'poutcome', 'cons_price_idx', 'cons_conf_idx', 'euribor3m', 'nr_employed',
        ];

        $totalProcessed = 0;
        $totalFailed    = 0;

        $query = Prospect::whereDoesntHave('scores');

        $query->chunkById(1000, function ($prospects) use (&$totalProcessed, &$totalFailed, $featureColumns) {
            
            $payload = [];

            foreach ($prospects as $prospect) {
                foreach ($featureColumns as $col) {
                    if (is_null($prospect->{$col})) continue 2; 
                }

                $payload[] = [
                    'id'             => $prospect->id, 
                    'age'            => (int) $prospect->age,
                    'job'            => (string) $prospect->job,
                    'education'      => (string) $prospect->education,
                    'month'          => (string) $prospect->month,
                    'duration'       => (float) $prospect->duration,
                    'campaign'       => (int) $prospect->campaign,
                    'poutcome'       => (string) $prospect->poutcome,
                    'cons.price.idx' => (float) $prospect->cons_price_idx,
                    'cons.conf.idx'  => (float) $prospect->cons_conf_idx,
                    'euribor3m'      => (float) $prospect->euribor3m,
                    'nr.employed'    => (float) $prospect->nr_employed,
                ];
            }

            if (empty($payload)) return;

            try {
                $response = Http::timeout(120)->post('http://127.0.0.1:8001/predict_batch', [
                    'data' => $payload
                ]);

                if ($response->successful()) {
                    $results = $response->json();

                    foreach ($results as $res) {
                        $pId  = $res['id'];
                        $prob = (float) $res['probability'];
                        
                        if ($prob >= 0.8) $priority = 1;
                        elseif ($prob >= 0.5) $priority = 2;
                        else $priority = 3;

                        PredictionScore::create([
                            'prospect_id'       => $pId,
                            'model_version'     => 'decision_tree_v1',
                            'score_value'       => $prob,
                            'priority'          => $priority,
                            'scored_by_user_id' => auth()->id() ?? null,
                        ]);
                        
                        $totalProcessed++;
                    }
                } else {
                    \Log::error("Python API Error: " . $response->body());
                    $totalFailed += count($payload);
                }

            } catch (\Exception $e) {
                \Log::error("Batch Prediction Exception: " . $e->getMessage());
                $totalFailed += count($payload);
            }
        });

        return redirect()->route('dashboard')
            ->with('success', "Proses selesai. {$totalProcessed} data berhasil diprediksi.");
    }
}