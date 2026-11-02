-- db/seed.test.sql - minimal SYNTHETIC seed for the throwaway test database. No production data.
-- Loaded after schema.sql (docker-entrypoint-initdb.d runs files alphabetically; see docker-compose.test.yml).
-- Documented test credential (fake): password KoperasiTest#2026 for user 'testadmin' and anggota employee 'T0001'.

SET NAMES utf8mb4;

INSERT INTO M_User_Group (GroupID, GroupName, GroupNote, PostBy) VALUES
  (1, 'TestAdmin', 'synthetic test group', 'seed');

INSERT INTO M_Menu (MenuID, MenuName, MenuParentID, MenuRoute, MenuSort, PostBy) VALUES
  (1, 'Test Parent', 0, '/test',       1, 'seed'),
  (2, 'Test Child',  1, '/test/child', 1, 'seed');

INSERT INTO M_Group_Authorization (GroupId, MenuId, Access) VALUES
  (1, 1, 1),
  (1, 2, 1);

INSERT INTO M_Users (UserLogin, UserPassword, UserName, UserEmail, PostBy, GroupID) VALUES
  ('testadmin', '$2b$10$m3WAK0Gl4hHsLkrGfHIYEetL4YdMwIcaYSIliV4WPh7EOl3oBJAmK', 'Test Admin', 'testadmin@example.test', 'seed', 1);

INSERT INTO M_Department (DepartmentId, DepartmentName, PostBy) VALUES
  ('TST', 'Test Department', 'seed');

INSERT INTO M_Setting_Simpanan (ID, SimpananPokok, SimpananWajib, SimpananSukarela) VALUES
  (1, 100000, 50000, 0);

INSERT INTO M_Anggota
  (NoAnggota, NoEmployee, Nama, Alamat, Telpon, JenisKelamin, DepartmentId, JenisAnggota, TanggalMasuk,
   NoRekening, IsNew, SimpananPokok, SimpananWajib, SimpananSukarela, StatusAnggota, PasswordLogin,
   AlamatEmail, CreatedUser, CreatedDate)
VALUES
  ('2026-0001', 'T0001', 'Test Anggota', 'Jl. Contoh 1', '000000', 'L', 'TST', 'KARYAWAN', '2026-01-15',
   '0000000000', 0, 100000, 50000, 0, 'AKTIF', '$2b$10$m3WAK0Gl4hHsLkrGfHIYEetL4YdMwIcaYSIliV4WPh7EOl3oBJAmK',
   'anggota@example.test', 'seed', '2026-01-15 08:00:00');

-- one existing deposit so a withdrawal (sp_Transaksi_Penarikan_Simpanan_Submit) has a balance to draw on
INSERT INTO T_Simpanan_Anggota
  (IDTransaksi, Tanggal, NoAnggota, JenisPosting, JenisTransaksi, JenisSimpanan, Jumlah, BulanAktif, CreatedUser, CreatedDate)
VALUES
  (1, '2026-01-15', '2026-0001', 'MANUAL', 'SETORAN', 'SIMPANAN SUKARELA', 1000000, 0, 'seed', '2026-01-15 08:00:00');
