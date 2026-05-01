import { supabase } from './supabase';

// Parameter idTugas sekarang punya tipe data 'number' (angka)
export async function hapusDataPermanen(idTugas: number) {
    console.log(`Mencoba menghapus tugas dengan ID: ${idTugas}...`);

    try {
        const { error } = await supabase
            .from('tasks') // Ganti 'tasks' dengan nama tabel yang benar di Supabase kalian
            .delete()
            .eq('id', idTugas);

        if (error) {
            throw error;
        }

        console.log("Data berhasil dihapus dari database!");
        alert("Sukses! Data sudah dihapus permanen.");
        
        // Memuat ulang halaman agar data yang dihapus hilang dari layar
        window.location.reload(); 

    } catch (error: any) {
        console.error("Waduh, gagal hapus data nih:", error.message);
        alert("Gagal menghapus data, cek console!");
    }
}