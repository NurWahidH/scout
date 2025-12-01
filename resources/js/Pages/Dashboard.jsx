import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, useForm, Link, router } from '@inertiajs/react';
import { 
    FaUsers, FaChartLine, FaRobot, FaCloudUploadAlt, 
    FaCheckCircle, FaExclamationCircle, FaSave, FaEdit, FaTimes, FaPlus
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

// --- KONSTANTA PILIHAN (DROPDOWN OPTIONS) ---
const OPT_JOBS = [
    'admin.', 'services', 'management', 'blue-collar', 'entrepreneur', 
    'student', 'technician', 'housemaid', 'self-employed', 'unemployed', 'retired'
];

const OPT_EDUCATION = [
    'basic.4y', 'basic.6y', 'basic.9y', 'high.school', 
    'professional.course', 'university.degree', 'illiterate', 'unknown'
];

const OPT_MONTHS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const OPT_POUTCOME = ['nonexistent', 'failure', 'success'];

// --- SUB-KOMPONEN UI (Didefinisikan DI LUAR agar tidak re-render/hilang fokus) ---

const InputGroup = ({ label, type = "text", placeholder, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-600 mb-1 capitalize">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange}
            className="text-sm border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 py-1.5"
            placeholder={placeholder}
        />
        {error && <span className="text-red-500 text-[10px] mt-1">{error}</span>}
    </div>
);

const SelectGroup = ({ label, options, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-600 mb-1 capitalize">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="text-sm border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 py-1.5 bg-white"
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt.toUpperCase()}
                </option>
            ))}
        </select>
        {error && <span className="text-red-500 text-[10px] mt-1">{error}</span>}
    </div>
);

// --- Komponen Modal Tambah Manual ---
const CreateProspectModal = ({ isOpen, onClose }) => {
    const { data, setData, post, processing, reset, errors } = useForm({
        age: '', 
        job: 'admin.', // Default value
        education: 'university.degree', // Default value
        month: 'may', // Default value
        duration: '',
        campaign: '', 
        poutcome: 'nonexistent', 
        cons_price_idx: '', 
        cons_conf_idx: '', 
        euribor3m: '', 
        nr_employed: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('dashboard.store'), {
            onSuccess: () => {
                reset();
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl m-4 p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <FaTimes size={18} />
                </button>
                
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FaPlus className="text-blue-600" /> Tambah Prospek Manual
                </h3>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kolom Kiri */}
                    <div className="space-y-3">
                        <InputGroup 
                            label="Age" 
                            type="number" 
                            placeholder="Contoh: 30"
                            value={data.age}
                            onChange={e => setData('age', e.target.value)}
                            error={errors.age}
                        />
                        
                        <SelectGroup 
                            label="Job" 
                            options={OPT_JOBS} 
                            value={data.job}
                            onChange={e => setData('job', e.target.value)}
                            error={errors.job}
                        />
                        <SelectGroup 
                            label="Education" 
                            options={OPT_EDUCATION} 
                            value={data.education}
                            onChange={e => setData('education', e.target.value)}
                            error={errors.education}
                        />
                        <SelectGroup 
                            label="Month" 
                            options={OPT_MONTHS} 
                            value={data.month}
                            onChange={e => setData('month', e.target.value)}
                            error={errors.month}
                        />
                        <SelectGroup 
                            label="Poutcome" 
                            options={OPT_POUTCOME} 
                            value={data.poutcome}
                            onChange={e => setData('poutcome', e.target.value)}
                            error={errors.poutcome}
                        />
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-3">
                        <InputGroup 
                            label="Duration (Last Contact)" 
                            type="number" 
                            placeholder="Seconds (e.g., 200)" 
                            value={data.duration}
                            onChange={e => setData('duration', e.target.value)}
                            error={errors.duration}
                        />
                        <InputGroup 
                            label="Campaign (Contacts)" 
                            type="number" 
                            placeholder="Number (e.g., 1)" 
                            value={data.campaign}
                            onChange={e => setData('campaign', e.target.value)}
                            error={errors.campaign}
                        />
                        <InputGroup 
                            label="Cons. Price Index" 
                            type="number" 
                            placeholder="e.g., 93.994" 
                            value={data.cons_price_idx}
                            onChange={e => setData('cons_price_idx', e.target.value)}
                            error={errors.cons_price_idx}
                        />
                        <InputGroup 
                            label="Cons. Conf. Index" 
                            type="number" 
                            placeholder="e.g., -36.4" 
                            value={data.cons_conf_idx}
                            onChange={e => setData('cons_conf_idx', e.target.value)}
                            error={errors.cons_conf_idx}
                        />
                        <InputGroup 
                            label="Euribor 3M" 
                            type="number" 
                            placeholder="e.g., 4.857" 
                            value={data.euribor3m}
                            onChange={e => setData('euribor3m', e.target.value)}
                            error={errors.euribor3m}
                        />
                        <InputGroup 
                            label="Nr. Employed" 
                            type="number" 
                            placeholder="e.g., 5191.0" 
                            value={data.nr_employed}
                            onChange={e => setData('nr_employed', e.target.value)}
                            error={errors.nr_employed}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow flex items-center gap-2">
                            {processing ? 'Menyimpan...' : <><FaSave /> Simpan Data</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Komponen Baris (Row) Terpisah untuk menangani State Edit per Baris
const ProspectRow = ({ item, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // State lokal untuk form edit
    const [values, setValues] = useState({
        age: item.age || '',
        job: item.job || '',
        education: item.education || '',
        month: item.month || '',
        duration: item.duration || '',
        campaign: item.campaign || '',
        poutcome: item.poutcome || '',
        cons_price_idx: item.cons_price_idx || '',
        cons_conf_idx: item.cons_conf_idx || '',
        euribor3m: item.euribor3m || '',
        nr_employed: item.nr_employed || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({ ...values, [name]: value });
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!isDirty) {
            setIsEditing(false);
            return;
        }
        
        // Mengirim request PUT ke backend
        router.put(route('dashboard.update', item.id), values, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
                setIsDirty(false);
            },
        });
    };

    const handleCancel = () => {
        // Reset values ke data awal
        setValues({
            age: item.age || '',
            job: item.job || '',
            education: item.education || '',
            month: item.month || '',
            duration: item.duration || '',
            campaign: item.campaign || '',
            poutcome: item.poutcome || '',
            cons_price_idx: item.cons_price_idx || '',
            cons_conf_idx: item.cons_conf_idx || '',
            euribor3m: item.euribor3m || '',
            nr_employed: item.nr_employed || '',
        });
        setIsEditing(false);
        setIsDirty(false);
    };

    // Helper untuk merender input atau select
    const renderCell = (name, type = "text", width = "w-24", options = null) => {
        if (isEditing) {
            // Jika ada options, render SELECT
            if (options) {
                return (
                    <select
                        name={name}
                        value={values[name]}
                        onChange={handleChange}
                        className={`text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded px-1 py-1 shadow-sm ${width}`}
                    >
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                    </select>
                );
            }

            // Jika tidak, render INPUT biasa
            return (
                <input 
                    type={type} 
                    name={name} 
                    value={values[name]} 
                    onChange={handleChange} 
                    className={`text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded px-2 py-1 shadow-sm ${width}`}
                />
            );
        }
        return <span className="text-gray-700">{item[name]}</span>;
    };

    return (
        <tr className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isEditing ? 'bg-blue-50/50' : ''}`}>
            
            {/* 1. ACTION COLUMN (Paling Kiri) */}
            <td className="px-4 py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {isEditing ? (
                    <div className="flex justify-center items-center gap-2">
                        <button 
                            onClick={handleSave} 
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100 transition" 
                            title="Simpan"
                        >
                            <FaSave />
                        </button>
                        <button 
                            onClick={handleCancel} 
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition" 
                            title="Batal"
                        >
                            <FaTimes />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-100 transition"
                        title="Edit Data"
                    >
                        <FaEdit />
                    </button>
                )}
            </td>

            {/* 2. ID */}
            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.id}</td>
            
            {/* 3. STATUS */}
            <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    item.status === 'NEW' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    item.status === 'PREDICTED' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                    {item.status}
                </span>
            </td>

            {/* 4. SCORE */}
            <td className="px-4 py-3 font-bold text-blue-600">
                {item.score !== null ? (item.score * 100).toFixed(1) + '%' : '-'}
            </td>

            {/* 5. PRIORITY */}
            <td className="px-4 py-3">
                {item.priority === 1 && <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">High</span>}
                {item.priority === 2 && <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-200">Medium</span>}
                {item.priority === 3 && <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">Low</span>}
                {!item.priority && <span className="text-gray-300">-</span>}
            </td>

            {/* --- DATA COLUMNS (Toggleable) --- */}
            {/* Pass options ke renderCell untuk kolom yang butuh dropdown */}
            <td className="px-4 py-3">{renderCell('age', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('job', 'text', 'w-32', OPT_JOBS)}</td>
            <td className="px-4 py-3">{renderCell('education', 'text', 'w-36', OPT_EDUCATION)}</td>
            <td className="px-4 py-3 uppercase">{renderCell('month', 'text', 'w-20', OPT_MONTHS)}</td>
            <td className="px-4 py-3">{renderCell('duration', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('campaign', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('poutcome', 'text', 'w-28', OPT_POUTCOME)}</td>
            <td className="px-4 py-3">{renderCell('cons_price_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('cons_conf_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('euribor3m', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('nr_employed', 'number', 'w-20')}</td>

            {/* SCORED AT (Paling Kanan) */}
            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {item.scored_at || '-'}
            </td>
        </tr>
    );
};

export default function Dashboard({ stats, prospects }) {
    // Dummy Data Fallback (Agar tidak error saat preview/kosong)
    const safeStats = stats || { total_prospects: 41191, processed: 39261, high_priority: 6870 };
    const safeProspects = prospects || { 
        data: [
            { id: 41191, status: 'NEW', score: 0.311, priority: 3, age: 28, job: 'technician', education: 'basic.9y', month: 'jul', duration: 180, campaign: 1, poutcome: 'nonexistent', cons_price_idx: 93.200, cons_conf_idx: -42.7, euribor3m: 4.959, nr_employed: 5195.0, scored_at: '2023-10-01 10:00' },
        ],
        links: []
    };

    const { auth, flash } = usePage().props;
    const isAdmin = auth.user.role === 'admin'; 
    const [isCreateModalOpen, setCreateModalOpen] = useState(false); // State Modal

    // --- FORM SETUP ---
    const { data: dataImport, setData: setDataImport, post: postImport, processing: processingImport, reset: resetImport } = useForm({
        csv_file: null,
    });
    const { post: postPredict, processing: processingPredict } = useForm({});

    const handleFileChange = (e) => {
        setDataImport('csv_file', e.target.files[0]);
    };
    
    const submitImport = (e) => {
        e.preventDefault();
        postImport(route('dashboard.import'), { 
            onSuccess: () => { 
                resetImport(); 
                const fileInput = document.getElementById('file-upload');
                if (fileInput) fileInput.value = ''; 
            } 
        });
    };
    
    const submitPredict = (e) => {
        e.preventDefault();
        postPredict(route('dashboard.predict'));
    };

    // --- ZOOM LOGIC (Added useEffect) ---
    useEffect(() => {
        // Mengatur zoom level ke 67% saat halaman ini dimuat
        document.body.style.zoom = "67%";

        // Reset zoom kembali ke 100% saat meninggalkan halaman (unmount)
        return () => {
            document.body.style.zoom = "100%";
        };
    }, []);

    return (
        <SidebarLayout header="Sales Analysis Dashboard">
            <Head title="Dashboard" />

            {/* Modal Create Manual */}
            <CreateProspectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

            {/* --- FLASH MESSAGE --- */}
            {flash.success && (
                <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center text-sm">
                    <FaCheckCircle /> <span className="ml-2">{flash.success}</span>
                </div>
            )}
            {flash.error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center text-sm">
                    <FaExclamationCircle /> <span className="ml-2">{flash.error}</span>
                </div>
            )}

            {/* --- STATISTIK CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4"><FaUsers size={20} /></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Prospek</p><h3 className="text-2xl font-bold text-gray-800">{safeStats.total_prospects}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
                    <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4"><FaCheckCircle size={20} /></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Sudah Diprediksi</p><h3 className="text-2xl font-bold text-gray-800">{safeStats.processed}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600 mr-4"><FaChartLine size={20} /></div>
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wider">High Priority</p><h3 className="text-2xl font-bold text-gray-800">{safeStats.high_priority}</h3></div>
                </div>
            </div>

            {/* --- MANAJEMEN DATA (ADMIN ONLY) --- */}
            {isAdmin && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-base font-bold text-gray-800">Manajemen Data</h3>
                            <p className="text-xs text-gray-500 mt-1">Import data CSV, tambah manual, atau jalankan prediksi AI.</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto text-sm items-center">
                            
                            {/* Tombol Tambah Manual */}
                            <button 
                                onClick={() => setCreateModalOpen(true)}
                                className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm w-full md:w-auto justify-center"
                            >
                                <FaPlus /> Tambah Manual
                            </button>

                            <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

                            {/* Form Import */}
                            <form onSubmit={submitImport} className="flex gap-2 items-center w-full md:w-auto">
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    accept=".csv" 
                                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <button type="submit" disabled={processingImport || !dataImport.csv_file} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow-sm hover:shadow whitespace-nowrap">
                                    <FaCloudUploadAlt /> Import CSV
                                </button>
                            </form>

                            {/* Tombol Prediksi */}
                            <form onSubmit={submitPredict} className="w-full md:w-auto">
                                <button type="submit" disabled={processingPredict} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow-sm hover:shadow w-full justify-center">
                                    <FaRobot /> {processingPredict ? 'Processing...' : 'Prediksi'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TABEL DATA --- */}
            {isAdmin ? (
                <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                        <h3 className="text-base font-bold text-gray-800">Daftar Prospek</h3>
                        <span className="text-xs text-gray-500 italic flex items-center gap-1">
                            <FaEdit className="text-blue-400" /> Prediksi akan terhapus jika mengedit data
                        </span>
                    </div>

                    {/* WRAPPER OVERFLOW-X-AUTO UTAMA */}
                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full whitespace-nowrap text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                                <tr>
                                    {/* Kolom Aksi di Kiri (Sticky agar tidak hilang saat scroll) */}
                                    <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-16">
                                        Edit
                                    </th>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-4 py-3">Job</th>
                                    <th className="px-4 py-3">Education</th>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3 text-center">Campaign</th>
                                    <th className="px-4 py-3">P.Out</th>
                                    <th className="px-4 py-3">C.Price</th>
                                    <th className="px-4 py-3">C.Conf</th>
                                    <th className="px-4 py-3">Euribor3m</th>
                                    <th className="px-4 py-3">N.Employed</th>
                                    <th className="px-4 py-3 text-right">Scored At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {safeProspects.data.length > 0 ? (
                                    safeProspects.data.map((item) => (
                                        <ProspectRow key={item.id} item={item} isAdmin={isAdmin} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="17" className="px-6 py-10 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FaCloudUploadAlt className="text-4xl text-gray-300 mb-3" />
                                                <p>Data kosong. Silakan import file atau Tambah Manual.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center bg-gray-50">
                        <span className="text-xs text-gray-500">
                            Menampilkan data halaman ini.
                        </span>
                        <div className="flex gap-1">
                            {safeProspects.links.map((link, key) => (
                                <Link
                                    key={key}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 text-xs border rounded transition shadow-sm ${
                                        link.active
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Halo, {auth.user.name}!</h3>
                    <p className="text-gray-500">
                        Anda login sebagai <strong>Sales</strong>. Silakan akses menu "Daftar Prospek" di sidebar 
                        untuk melihat daftar prospek yang ditugaskan kepada Anda.
                    </p>
                </div>
            )}
        </SidebarLayout>
    );
}