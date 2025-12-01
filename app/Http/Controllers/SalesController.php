<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity; // Model baru yang Anda buat
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    // Definisi Status Master
    private $statuses = [
        ['code' => 'NEW',            'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
        ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
        ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
        ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Nasabah setuju mendaftar'],
        ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Nasabah menolak penawaran'],
        ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Telepon tidak diangkat berkali-kali'],
        ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
    ];

    /**
     * Halaman Utama List Prospek Sales
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        $prospects = Prospect::with(['status', 'latestScore'])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function ($item) {
                return [
                    'id'             => $item->id,
                    'status_code'    => $item->status ? $item->status->status_code : 'NEW',
                    'description'    => $item->description, 
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    
                    // Data Nasabah
                    'age'            => $item->age,
                    'job'            => $item->job,
                    'education'      => $item->education,
                    'month'          => $item->month,
                    'duration'       => $item->duration, // Durasi dari data CSV (history lama)
                    'campaign'       => $item->campaign,
                    'poutcome'       => $item->poutcome,
                ];
            });

        return Inertia::render('Prospects', [
            'prospects'     => $prospects,
            'statusOptions' => $this->statuses,
        ]);
    }

    /**
     * Update Biasa (Tanpa Tracking Timer) - Dipanggil jika sales edit manual via tabel
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status_code' => 'required|string',
            'description' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            
            // Panggil helper function private di bawah
            $this->updateProspectData($prospect, $validated['status_code'], $validated['description']);
            
            DB::commit();
            return back()->with('success', 'Data berhasil diupdate.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    /**
     * Log Activity (Dipanggil dari Modal Tracking Telepon)
     * Mengisi tabel contact_activities DAN update status prospek sekaligus
     */
    public function logActivity(Request $request)
    {
        // Validasi input dari Modal Call di React
        $validated = $request->validate([
            'prospect_id'       => 'required|exists:prospects,id',
            'status_code'       => 'required|string',
            'contact_notes'     => 'nullable|string',     
            'call_duration_sec' => 'required|integer|min:0', // Durasi dari Timer React
            'contact_channel'   => 'required|string',     // Default 'Phone'
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($validated['prospect_id']);

            // 1. Update Data Utama Prospek (Agar tampilan tabel depan berubah statusnya)
            // Catatan aktivitas dijadikan deskripsi prospek saat ini
            $statusId = $this->updateProspectData($prospect, $validated['status_code'], $validated['contact_notes']);

            // 2. Simpan Log Sejarah ke Tabel contact_activities
            ContactActivity::create([
                'prospect_id'        => $prospect->id,
                'telemarketer_id'    => $request->user()->id,
                'prospect_status_id' => $statusId, // ID status yang baru diupdate/dibuat
                'contact_channel'    => $validated['contact_channel'],
                'contact_notes'      => $validated['contact_notes'],
                'call_duration_sec'  => $validated['call_duration_sec'], // Isi otomatis dari timer
                'contact_at'         => now(),
            ]);

            DB::commit();
            return back()->with('success', 'Aktivitas Telepon berhasil disimpan & dilacak.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan log: ' . $e->getMessage());
        }
    }

    /**
     * Helper Function: Agar logika update status & deskripsi tidak ditulis ulang 2x
     */
    private function updateProspectData($prospect, $statusCode, $description)
    {
        // 1. Update Deskripsi Terakhir
        $prospect->description = $description;
        
        // 2. Logic Cari/Buat Status ID berdasarkan Code
        $statusConfig = collect($this->statuses)->firstWhere('code', $statusCode);
        $statusId = $prospect->prospect_status_id; // Default pakai status lama jika config ga ketemu

        if ($statusConfig) {
            $statusModel = ProspectStatus::firstOrCreate(
                ['status_code' => $statusCode],
                [
                    'status_type' => $statusConfig['type'],
                    'description' => $statusConfig['desc']
                ]
            );
            $prospect->prospect_status_id = $statusModel->id;
            $statusId = $statusModel->id;
        }

        $prospect->save();
        
        // Kembalikan ID status untuk dipakai di tabel activity
        return $statusId;
    }
}