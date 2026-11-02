-- =============================================================================
-- !! TEST/ONBOARDING ONLY. NEVER RUN AGAINST A REAL DATABASE !!
-- It starts with DROP TABLE IF EXISTS on every table, and sp_M_Anggota_Insert uses the TEST
-- default password hash instead of the production one.
-- =============================================================================
-- db/schema.sql  -  schema only (NO DATA) for the Sistem Informasi Koperasi database
-- Source: MySQL 8.4.8 (lower_case_table_names=0, i.e. table names are CASE-SENSITIVE).
-- Contents: 13 tables, 2 views, 24 stored procedures, 0 functions, 0 triggers, 0 events.
--
-- HOW TO LOAD (MySQL 8.x, mysql client; the file uses DELIMITER so it must go through the client, not a driver):
--   mysql -h HOST -P PORT -u USER -p DBNAME < db/schema.sql
-- or let the docker image do it: mount it into /docker-entrypoint-initdb.d (see db/docker-compose.test.yml).
-- No CREATE DATABASE / USE: the target database is chosen by the loader.
--
-- Normalisations applied to the raw SHOW CREATE output:
--   * DEFINER=... removed everywhere (objects get the loading user as definer). Views keep
--     "SQL SECURITY DEFINER" (valid without an explicit DEFINER; runs as the loading user).
--   * AUTO_INCREMENT=<n> table options removed.
--   * Each procedure is preceded by SET SESSION sql_mode = '<its original stored sql_mode>' because the
--     production server runs with ANSI-style modes (ANSI_QUOTES, PIPES_AS_CONCAT, ...). Identifiers are
--     back-quoted so the file loads under any mode.
--   * sp_M_Anggota_Insert originally embeds the bcrypt hash of the production default anggota password.
--     That hash is REPLACED here by the hash of the documented test password (see db-knowledge.md).
--     Everything else in the procedure is byte-identical.
-- =============================================================================

SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------- tables
DROP TABLE IF EXISTS `M_Anggota`;
CREATE TABLE `M_Anggota` (
  `NoAnggota` varchar(15) NOT NULL,
  `NoEmployee` varchar(10) NOT NULL,
  `Nama` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Alamat` varchar(200) DEFAULT NULL,
  `Telpon` varchar(100) DEFAULT NULL,
  `JenisKelamin` varchar(50) DEFAULT NULL,
  `DepartmentId` varchar(20) DEFAULT NULL,
  `JenisAnggota` varchar(20) DEFAULT NULL,
  `TanggalMasuk` date DEFAULT NULL,
  `NoRekening` varchar(50) DEFAULT NULL,
  `IsNew` tinyint(1) DEFAULT NULL,
  `SimpananPokok` int DEFAULT NULL,
  `SimpananWajib` int DEFAULT NULL,
  `SimpananSukarela` int DEFAULT NULL,
  `StatusAnggota` varchar(20) DEFAULT NULL,
  `PasswordLogin` varchar(1000) DEFAULT NULL,
  `AlamatEmail` varchar(200) DEFAULT NULL,
  `CreatedUser` varchar(50) DEFAULT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  `UpdatedUser` varchar(50) DEFAULT NULL,
  `UpdatedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`NoAnggota`),
  UNIQUE KEY `M_Anggota_AlamatEmail_Unique` (`AlamatEmail`) USING BTREE,
  KEY `M_Anggota_idx` (`NoEmployee`,`Nama`,`DepartmentId`,`JenisAnggota`,`StatusAnggota`) USING BTREE,
  KEY `M_Anggota_M_Department_FK` (`DepartmentId`),
  CONSTRAINT `M_Anggota_M_Department_FK` FOREIGN KEY (`DepartmentId`) REFERENCES `M_Department` (`DepartmentId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Anggota_LastNo`;
CREATE TABLE `M_Anggota_LastNo` (
  `Tahun` char(4) NOT NULL,
  `LastNumber` int NOT NULL,
  PRIMARY KEY (`Tahun`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Department`;
CREATE TABLE `M_Department` (
  `DepartmentId` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DepartmentName` varchar(255) NOT NULL,
  `PostBy` varchar(100) DEFAULT NULL,
  `PostDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DepartmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Group_Authorization`;
CREATE TABLE `M_Group_Authorization` (
  `GroupId` int NOT NULL,
  `MenuId` int NOT NULL,
  `Access` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = unauthorized\n1 = authorized',
  `MenuAuthId` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`MenuAuthId`),
  KEY `GroupId` (`GroupId`,`MenuId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Menu`;
CREATE TABLE `M_Menu` (
  `MenuID` int NOT NULL AUTO_INCREMENT,
  `MenuName` varchar(50) DEFAULT NULL,
  `MenuParentID` bigint DEFAULT NULL,
  `MenuRoute` varchar(150) DEFAULT NULL,
  `MenuSort` int DEFAULT NULL,
  `PostBy` varchar(50) DEFAULT NULL,
  `PostDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MenuID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Setting_Simpanan`;
CREATE TABLE `M_Setting_Simpanan` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `SimpananPokok` int DEFAULT NULL,
  `SimpananWajib` int DEFAULT NULL,
  `SimpananSukarela` int DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_User_Group`;
CREATE TABLE `M_User_Group` (
  `GroupID` int NOT NULL,
  `GroupName` varchar(50) DEFAULT NULL,
  `GroupNote` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `PostBy` varchar(50) DEFAULT NULL,
  `PostDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`GroupID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `M_Users`;
CREATE TABLE `M_Users` (
  `UserLogin` varchar(50) NOT NULL,
  `UserPassword` varchar(250) NOT NULL,
  `UserName` varchar(100) NOT NULL,
  `UserEmail` varchar(100) DEFAULT NULL,
  `PostBy` varchar(100) NOT NULL,
  `PostDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `GroupID` int DEFAULT NULL,
  PRIMARY KEY (`UserLogin`),
  KEY `M_User_M_User_Group_idx` (`GroupID`),
  CONSTRAINT `M_User_M_User_Group` FOREIGN KEY (`GroupID`) REFERENCES `M_User_Group` (`GroupID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tabel untuk menyimpan data user login';

DROP TABLE IF EXISTS `T_Simpanan_Anggota`;
CREATE TABLE `T_Simpanan_Anggota` (
  `IDTransaksi` bigint NOT NULL AUTO_INCREMENT,
  `Tanggal` date NOT NULL,
  `NoAnggota` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `JenisPosting` varchar(10) DEFAULT NULL,
  `JenisTransaksi` varchar(10) DEFAULT NULL,
  `JenisSimpanan` varchar(20) DEFAULT NULL,
  `Jumlah` double DEFAULT NULL,
  `BulanAktif` int DEFAULT NULL,
  `CreatedUser` varchar(50) DEFAULT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`IDTransaksi`),
  KEY `T_Simpanan_Anggota_M_Anggota_FK` (`NoAnggota`),
  KEY `T_Simpanan_Anggota_Tanggal_IDX` (`Tanggal`,`NoAnggota`),
  CONSTRAINT `T_Simpanan_Anggota_M_Anggota_FK` FOREIGN KEY (`NoAnggota`) REFERENCES `M_Anggota` (`NoAnggota`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `T_Simpanan_Penarikan`;
CREATE TABLE `T_Simpanan_Penarikan` (
  `IDPengambilan` bigint NOT NULL AUTO_INCREMENT,
  `IDTransaksiSimpanan` bigint DEFAULT NULL,
  `Tanggal` date DEFAULT NULL,
  `NoAnggota` varchar(15) DEFAULT NULL,
  `JenisSimpanan` varchar(20) DEFAULT NULL,
  `Jumlah` double DEFAULT NULL,
  `CreatedUser` varchar(50) DEFAULT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  `TanggalTransfer` datetime DEFAULT NULL,
  `NoRef` varchar(50) DEFAULT NULL,
  `StatusTransaksi` varchar(5) DEFAULT 'OPEN' COMMENT 'OPEN, CLOSE',
  PRIMARY KEY (`IDPengambilan`),
  KEY `IDX_T_Simpanan_Penarikan` (`IDTransaksiSimpanan`,`Tanggal`,`NoAnggota`,`StatusTransaksi`),
  CONSTRAINT `PenarikanSimpanan` FOREIGN KEY (`IDTransaksiSimpanan`) REFERENCES `T_Simpanan_Anggota` (`IDTransaksi`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `T_Simpanan_Penarikan_Resign`;
CREATE TABLE `T_Simpanan_Penarikan_Resign` (
  `IDPengambilan` bigint NOT NULL AUTO_INCREMENT,
  `Tanggal` date DEFAULT NULL,
  `NoAnggota` varchar(15) DEFAULT NULL,
  `SimpananPokok` int DEFAULT NULL,
  `SimpananWajib` int DEFAULT NULL,
  `SimpananSukarela` int DEFAULT NULL,
  `CreatedUser` varchar(50) DEFAULT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  `TanggalTransfer` datetime DEFAULT NULL,
  `NoRef` varchar(50) DEFAULT NULL,
  `StatusTransaksi` varchar(5) DEFAULT NULL COMMENT 'OPEN / CLOSE',
  PRIMARY KEY (`IDPengambilan`),
  KEY `IDX_Tanggal_NoAnggota` (`Tanggal`,`NoAnggota`,`StatusTransaksi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `T_Simpanan_Posting`;
CREATE TABLE `T_Simpanan_Posting` (
  `IDTransaksi` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Tanggal` date DEFAULT NULL,
  `TotalAnggota` int DEFAULT NULL,
  `TotalSimpananPokok` int DEFAULT NULL,
  `TotalSimpananWajib` int DEFAULT NULL,
  `TotalSimpananSukarela` int DEFAULT NULL,
  `TotalSimpanan` int DEFAULT NULL,
  `CreatedUser` varchar(50) DEFAULT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`IDTransaksi`),
  KEY `IDX_T_Simpanan_Posting` (`Tanggal`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `T_Simpanan_Posting_Detail`;
CREATE TABLE `T_Simpanan_Posting_Detail` (
  `IDDetail` bigint NOT NULL AUTO_INCREMENT,
  `IDTransaksi` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `NoAnggota` varchar(15) DEFAULT NULL,
  `NoEmployee` varchar(10) DEFAULT NULL,
  `SimpananPokok` int DEFAULT NULL,
  `SimpananWajib` int DEFAULT NULL,
  `SimpananSukarela` int DEFAULT NULL,
  PRIMARY KEY (`IDDetail`),
  KEY `IDX_ID_Transaksi` (`IDTransaksi`,`NoAnggota`,`NoEmployee`),
  CONSTRAINT `T_Simpanan_Posting_Detail_ibfk_1` FOREIGN KEY (`IDTransaksi`) REFERENCES `T_Simpanan_Posting` (`IDTransaksi`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- ---------------------------------------------------------------- views
DROP VIEW IF EXISTS `vw_M_Anggota`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_M_Anggota` AS select `a`.`NoAnggota` AS `NoAnggota`,`a`.`NoEmployee` AS `NoEmployee`,`a`.`Nama` AS `Nama`,`a`.`Alamat` AS `Alamat`,`a`.`Telpon` AS `Telpon`,`a`.`JenisKelamin` AS `JenisKelamin`,`a`.`DepartmentId` AS `DepartmentId`,`d`.`DepartmentName` AS `DepartmentName`,`a`.`JenisAnggota` AS `JenisAnggota`,`a`.`TanggalMasuk` AS `TanggalMasuk`,`a`.`NoRekening` AS `NoRekening`,`a`.`SimpananPokok` AS `SimpananPokok`,`a`.`SimpananWajib` AS `SimpananWajib`,`a`.`SimpananSukarela` AS `SimpananSukarela`,`a`.`StatusAnggota` AS `StatusAnggota`,`a`.`AlamatEmail` AS `AlamatEmail`,`a`.`CreatedUser` AS `CreatedUser`,`a`.`CreatedDate` AS `CreatedDate`,`a`.`UpdatedUser` AS `UpdatedUser`,`a`.`UpdatedDate` AS `UpdatedDate` from (`M_Anggota` `a` left join `M_Department` `d` on((`a`.`DepartmentId` = `d`.`DepartmentId`)));

DROP VIEW IF EXISTS `vw_M_User_Login`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_M_User_Login` AS select `u`.`UserLogin` AS `UserLogin`,`u`.`UserName` AS `UserName`,`u`.`UserEmail` AS `UserEmail`,`u`.`PostBy` AS `PostBy`,`u`.`PostDate` AS `PostDate`,`g`.`GroupID` AS `GroupID`,`g`.`GroupName` AS `GroupName` from (`M_Users` `u` join `M_User_Group` `g` on((`u`.`GroupID` = `g`.`GroupID`)));

-- ---------------------------------------------------------------- stored procedures
DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_Get_Anggota_Login`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Get_Anggota_Login`(
	IN p_NoAnggota varchar(255)
)
BEGIN
    SELECT 
        a.`NoAnggota`,
        a.`NoEmployee`,
        a.`Nama`,
        a.`PasswordLogin`,
        a.`AlamatEmail`,
        a.`DepartmentId`,
        d.`DepartmentName`
    FROM 
        `M_Anggota` a
    LEFT JOIN 
        `M_Department` d ON a.`DepartmentId` = d.`DepartmentId`
	WHERE NoAnggota = p_NoAnggota;
END$$

DROP PROCEDURE IF EXISTS `sp_get_group_authorization`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_get_group_authorization`(IN p_group_id INT)
BEGIN
    SELECT
        ug.GroupID,
        ug.GroupName,
        m.MenuID,
        m.MenuName,
        m.MenuParentID,
        m.MenuRoute,
        CAST(ga.Access AS UNSIGNED) AS AccessValue       
    FROM `M_Group_Authorization` ga
    INNER JOIN `M_User_Group` ug ON ug.GroupID = ga.GroupId
    INNER JOIN `M_Menu` m ON m.MenuID = ga.MenuId
    WHERE ug.GroupID = p_group_id
      AND CAST(ga.Access AS UNSIGNED) = 1
    ORDER BY m.MenuParentID, m.MenuSort;
END$$

DROP PROCEDURE IF EXISTS `sp_Get_Users_Login`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Get_Users_Login`(
	IN p_UserLogin varchar(255)
)
BEGIN
    SELECT 
        u.`UserLogin`,
        u.`UserPassword`,
        u.`UserName`,
        u.`UserEmail`,
        u.`GroupID`,
        g.`GroupName`
    FROM 
        `M_Users` u
    LEFT JOIN 
        `M_User_Group` g ON u.`GroupID` = g.`GroupID`
	WHERE UserLogin = p_UserLogin;
END$$

DROP PROCEDURE IF EXISTS `sp_M_Anggota_Insert`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_M_Anggota_Insert`(
    IN p_NoEmployee VARCHAR(255),
    IN p_Nama VARCHAR(255),
    IN p_Alamat VARCHAR(255),
    IN p_Telpon VARCHAR(255),
    IN p_JenisKelamin VARCHAR(255),
    IN p_DepartmentId VARCHAR(255),
    IN p_JenisAnggota VARCHAR(255),
    IN p_TanggalMasuk DATE,
    IN p_NoRekening VARCHAR(255),
    IN p_SimpananPokok INT,
    IN p_SimpananWajib INT,
    IN p_SimpananSukarela INT,
    IN p_AlamatEmail VARCHAR(255),
    IN p_CreatedUser VARCHAR(255),
    OUT p_Message VARCHAR(4000)
)
BEGIN
	DECLARE v_CurrentDate DATETIME;
    DECLARE v_Year CHAR(4);
    DECLARE v_NextRunning INT;
    DECLARE v_RunningStr CHAR(4);
    DECLARE v_NoAnggota VARCHAR(20);

    DECLARE v_sqlstate CHAR(5) DEFAULT NULL;
    DECLARE v_errno INT DEFAULT NULL;
    DECLARE v_text VARCHAR(255) DEFAULT NULL;
 
    -- Handler untuk error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE,
            v_errno = MYSQL_ERRNO,
            v_text = MESSAGE_TEXT;
        ROLLBACK;
        SET p_Message = CONCAT('Error ', v_errno, ' (', v_sqlstate, '): ', v_text);
    END;

	-- Ambil tanggal hari ini
	SET v_CurrentDate = CURRENT_TIMESTAMP();
	-- '2028-09-17 16:23:23';
	-- CURRENT_TIMESTAMP();
 
    -- Ambil tahun sekarang
    SET v_Year = DATE_FORMAT(v_CurrentDate, '%Y');
 
    -- Mulai transaksi
    START TRANSACTION;
 
    -- Insert tahun baru atau update running number
    -- INSERT INTO M_Anggota_LastNo (Tahun, LastNumber)
    -- VALUES (v_Year, 1)
    -- ON DUPLICATE KEY UPDATE LastNumber = LastNumber + 1;
    
    -- Cek apakah tahun berjalan sudah ada
   	-- Jika sudah ada, update running number
	IF EXISTS (SELECT 1 FROM M_Anggota_LastNo WHERE Tahun = v_Year) THEN
	    UPDATE M_Anggota_LastNo
	    SET LastNumber = LastNumber + 1
	    WHERE Tahun = v_Year;
	ELSE
	    -- Jika belum ada, hapus tahun sebelumnya lalu insert tahun berjalan
	    DELETE FROM M_Anggota_LastNo;
	    INSERT INTO M_Anggota_LastNo (Tahun, LastNumber)
	    VALUES (v_Year, 1);
	END IF;
 
    -- Ambil running number terbaru
    SELECT LastNumber INTO v_NextRunning
    FROM M_Anggota_LastNo
    WHERE Tahun = v_Year
    FOR UPDATE;
 
    -- Format running number menjadi 4 digit
    SET v_RunningStr = LPAD(v_NextRunning, 4, '0');
 
    -- Gabungkan tahun dan running number
    SET v_NoAnggota = CONCAT(v_Year, '-', v_RunningStr);
 
    -- Insert data anggota baru
    INSERT INTO M_Anggota (
        NoAnggota, NoEmployee, Nama, Alamat, Telpon, JenisKelamin, DepartmentId,
        JenisAnggota, TanggalMasuk, NoRekening, IsNew, SimpananPokok, SimpananWajib,
        SimpananSukarela, StatusAnggota, PasswordLogin, AlamatEmail, CreatedUser,
        CreatedDate
    ) VALUES (
        v_NoAnggota, p_NoEmployee, p_Nama, p_Alamat, p_Telpon, p_JenisKelamin, p_DepartmentId,
        p_JenisAnggota, p_TanggalMasuk, p_NoRekening, 1, p_SimpananPokok, p_SimpananWajib,
        p_SimpananSukarela, 'BELUM AKTIF', '$2b$10$m3WAK0Gl4hHsLkrGfHIYEetL4YdMwIcaYSIliV4WPh7EOl3oBJAmK', p_AlamatEmail, p_CreatedUser,
        v_CurrentDate
    );
 
    -- Commit jika sukses
    COMMIT;
    SET p_Message = 'Insert anggota berhasil.';
END$$

DROP PROCEDURE IF EXISTS `sp_M_Anggota_Update`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_M_Anggota_Update`(
    IN p_NoAnggota VARCHAR(255),
    IN p_NoEmployee VARCHAR(255),
    IN p_Nama VARCHAR(255),
    IN p_Alamat VARCHAR(255),
    IN p_Telpon VARCHAR(255),
    IN p_JenisKelamin VARCHAR(255),
    IN p_DepartmentId VARCHAR(255),
    IN p_JenisAnggota VARCHAR(255),
    IN p_TanggalMasuk DATE,
    IN p_NoRekening VARCHAR(255),
    IN p_SimpananPokok INT,
    IN p_SimpananWajib INT,
    IN p_SimpananSukarela INT,
    IN p_StatusAnggota VARCHAR(255),
    IN p_AlamatEmail VARCHAR(255),
    IN p_UpdatedUser VARCHAR(255),
    OUT p_Message VARCHAR(255)
)
BEGIN
	
	DECLARE v_sqlstate CHAR(5) DEFAULT NULL;
    DECLARE v_errno INT DEFAULT NULL;
    DECLARE v_text VARCHAR(255) DEFAULT NULL;

	-- Handler untuk error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE,
            v_errno = MYSQL_ERRNO,
            v_text = MESSAGE_TEXT;
        ROLLBACK;
        SET p_Message = CONCAT('Error ', v_errno, ' (', v_sqlstate, '): ', v_text);
    END;

	-- Mulai transaksi
    START TRANSACTION;

    UPDATE `M_Anggota`
    SET
        `NoEmployee` = p_NoEmployee,
        `Nama` = p_Nama,
        `Alamat` = p_Alamat,
        `Telpon` = p_Telpon,
        `JenisKelamin` = p_JenisKelamin,
        `DepartmentId` = p_DepartmentId,
        `JenisAnggota` = p_JenisAnggota,
        `TanggalMasuk` = p_TanggalMasuk,
        `NoRekening` = p_NoRekening,
        `SimpananPokok` = p_SimpananPokok,
        `SimpananWajib` = p_SimpananWajib,
        `SimpananSukarela` = p_SimpananSukarela,
        `StatusAnggota` = p_StatusAnggota,
        `AlamatEmail` = p_AlamatEmail,
        `UpdatedUser` = p_UpdatedUser,
        `UpdatedDate` = CURRENT_TIMESTAMP()
    WHERE `NoAnggota` = p_NoAnggota;
    
    -- Commit jika sukses
    COMMIT;
    SET p_Message = 'Update anggota berhasil.';
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Close_Transaksi`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Close_Transaksi`(
	p_IDPengambilan BIGINT,
	p_TanggalTransfer DATE,	
	p_NoRef VARCHAR(10)
)
BEGIN
	UPDATE T_Simpanan_Penarikan SET 
		TanggalTransfer = p_TanggalTransfer, 
		NoRef = p_NoRef,
		StatusTransaksi = 'CLOSE'
	WHERE IDPengambilan = p_IDPengambilan;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Get`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Get`(
	p_IDPengambilan BIGINT
)
BEGIN
	select IDPengambilan, IDTransaksiSimpanan, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, b.NoRekening, ABS(Jumlah) AS Jumlah, a.CreatedUser
	, a.CreatedDate, TanggalTransfer, NoRef, StatusTransaksi
	from T_Simpanan_Penarikan a inner join M_Anggota b on a.NoAnggota = b.NoAnggota
	where IDPengambilan = p_IDPengambilan;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Get_Saldo`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Get_Saldo`(
	p_NoEmployee varchar(50),
	p_JenisSimpanan varchar(50)
)
BEGIN
	select b.NoEmployee, b.NoAnggota, b.Nama, SUM(Jumlah) as Saldo 
	from T_Simpanan_Anggota a inner join M_Anggota b on a.NoAnggota = b.NoAnggota
	where b.NoEmployee = p_NoEmployee
	and b.StatusAnggota ='AKTIF'
	and a.JenisSimpanan = p_JenisSimpanan
	group by b.NoEmployee, b.NoAnggota, b.Nama;
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Resign_Close_Transaksi`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Resign_Close_Transaksi`(
	p_IDPengambilan BIGINT,
	p_TanggalTransfer DATE,	
	p_NoRef VARCHAR(10)
)
BEGIN
	UPDATE T_Simpanan_Penarikan_Resign SET 
		TanggalTransfer = p_TanggalTransfer, 
		NoRef = p_NoRef,
		StatusTransaksi = 'CLOSE'
	WHERE IDPengambilan = p_IDPengambilan;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Resign_Get`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Resign_Get`(
	p_IDPengambilan BIGINT
)
BEGIN
	select IDPengambilan, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, b.NoRekening, Jumlah AS Jumlah, a.CreatedUser
	, a.CreatedDate, TanggalTransfer, NoRef, StatusTransaksi
	from T_Simpanan_Penarikan_Resign a inner join M_Anggota b on a.NoAnggota = b.NoAnggota
	where IDPengambilan = p_IDPengambilan;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Resign_Submit`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Resign_Submit`(
	IN p_IDPengambilan BIGINT,
	IN p_Tanggal DATE,	
	IN p_NoAnggota VARCHAR(10),
	IN p_SimpananPokok INT,
	IN p_SimpananWajib INT,
	IN p_SimpananSukarela INT,
	IN p_CreatedUser VARCHAR(50),
	OUT p_Message VARCHAR(4000)
)
BEGIN
	DECLARE v_CreatedDate DATETIME;
	
	DECLARE v_sqlstate CHAR(5) DEFAULT NULL;
	DECLARE v_errno INT DEFAULT NULL;
	DECLARE v_text VARCHAR(255) DEFAULT NULL;
	
	DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
			-- Jika error, rollback
			GET DIAGNOSTICS CONDITION 1
					v_sqlstate = RETURNED_SQLSTATE,
					v_errno = MYSQL_ERRNO,
					v_text = MESSAGE_TEXT;
	
			ROLLBACK;
			SET p_Message = CONCAT('Error ', v_errno, ' (', v_sqlstate, '): ', v_text);
	END;

	START TRANSACTION;
  
  SET time_zone = '+07:00';
	SET v_CreatedDate = CURRENT_TIMESTAMP;
    
	IF p_IDPengambilan = 0 THEN		
			-- insert ke table T_Simpanan_Penarikan
			
			INSERT INTO T_Simpanan_Penarikan_Resign(
				Tanggal,
				NoAnggota,
				SimpananPokok,
				SimpananWajib,
				SimpananSukarela,
				CreatedUser,
				CreatedDate
			)
			VALUES(
				p_Tanggal,
				p_NoAnggota,
				p_SimpananPokok,
				p_SimpananWajib,
				p_SimpananSukarela,
				p_CreatedUser,
				v_CreatedDate
			);
			
		UPDATE M_Anggota SET StatusAnggota='RESIGN' WHERE NoAnggota=p_NoAnggota;
		-- UPDATE M_Anggota_Jasa set StatusJasa='DEL' where NoAnggota=p_NoAnggota;

	ELSE
		DELETE FROM T_Simpanan_Penarikan_Resign WHERE IDPengambilan = p_IDPengambilan;
		UPDATE M_Anggota SET StatusAnggota='AKTIF' WHERE NoAnggota=p_NoAnggota;
			
	END IF;
	
	COMMIT;
	SET p_Message = 'success';
    
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Resign_View`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Resign_View`(
	in p_Status varchar(10),
	IN p_DateFrom date,
	in p_DateTo date,
	in p_NoKaryawan varchar(50)
)
BEGIN
	SELECT IDPengambilan, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, b.NoRekening, SimpananPokok, SimpananWajib, SimpananSukarela
	, a.CreatedUser, a.CreatedDate, TanggalTransfer, NoRef, StatusTransaksi
	FROM T_Simpanan_Penarikan_Resign a inner join M_Anggota b on a.NoAnggota=b.NoAnggota
	WHERE a.StatusTransaksi = p_Status
	and (Tanggal between p_DateFrom and p_DateTo) 
	AND b.NoEmployee LIKE p_NoKaryawan 
	order by IDPengambilan desc;
	
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_Submit`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_Submit`(
	in p_IDPengambilan BIGINT,
	IN p_IDTransaksiSimpanan BIGINT,
	IN p_Tanggal DATE,	
	IN p_NoEmployee VARCHAR(10),
	IN p_JenisSimpanan varchar(50),
	IN p_Jumlah INT,
	IN p_CreatedUser VARCHAR(50),
	OUT p_Message VARCHAR(4000)
)
BEGIN
	DECLARE v_CreatedDate DATETIME;
	
	DECLARE v_sqlstate CHAR(5) DEFAULT NULL;
	DECLARE v_errno INT DEFAULT NULL;
	DECLARE v_text VARCHAR(255) DEFAULT NULL;
	DECLARE v_NoAnggota VARCHAR(10)	DEFAULT NULL;

	
	DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
			-- Jika error, rollback
			GET DIAGNOSTICS CONDITION 1
					v_sqlstate = RETURNED_SQLSTATE,
					v_errno = MYSQL_ERRNO,
					v_text = MESSAGE_TEXT;
	
			ROLLBACK;
			SET p_Message = CONCAT('Error ', v_errno, ' (', v_sqlstate, '): ', v_text);
	END;

	START TRANSACTION;
  
  	SET time_zone = '+07:00';
	SET v_CreatedDate = CURRENT_TIMESTAMP;

	-- ambil no anggota dari no employee
	SELECT NoAnggota INTO v_NoAnggota FROM M_Anggota WHERE NoEmployee = p_NoEmployee;
    
	IF p_IDPengambilan = 0 THEN
			-- insert ke table T_Simpanan_Anggota
			INSERT INTO T_Simpanan_Anggota(
				Tanggal, 
				NoAnggota, 
				JenisPosting, 
				JenisTransaksi, 
				JenisSimpanan, 
				Jumlah, 
				BulanAktif, 
				CreatedUser, 
				CreatedDate
			)
			VALUES(
				p_Tanggal, 
				v_NoAnggota, 
				'MANUAL', 
				'PENARIKAN', 
				p_JenisSimpanan, 
				-ABS(p_Jumlah), 
				0, 
				p_CreatedUser, 
				v_CreatedDate
			);
			
			-- Get IDTransaksi yang baru di insert
			SET @New_IDTransaksi = LAST_INSERT_ID();
			
			-- insert ke table T_Simpanan_Penarikan
			
			insert into T_Simpanan_Penarikan(
				IDTransaksiSimpanan,
				Tanggal,
				NoAnggota,
				JenisSimpanan,
				Jumlah,
				CreatedUser,
				CreatedDate
			)
			values(
				@New_IDTransaksi,
				p_Tanggal,
				v_NoAnggota,
				p_JenisSimpanan,
				p_Jumlah,
				p_CreatedUser,
				v_CreatedDate
			);

	ELSE
			-- update table T_Simpanan_Anggota
			UPDATE T_Simpanan_Anggota SET 
				Tanggal = p_Tanggal, 
				NoAnggota = v_NoAnggota, 
				JenisSimpanan = p_JenisSimpanan,
				Jumlah = -ABS(p_Jumlah), 
				CreatedUser = p_CreatedUser, 
				CreatedDate = v_CreatedDate
			WHERE IDTransaksi = p_IDTransaksiSimpanan;
			
			-- update table T_Simpanan_Penarikan
			UPDATE T_Simpanan_Penarikan SET 
				Tanggal = p_Tanggal, 
				NoAnggota = v_NoAnggota,
				JenisSimpanan = p_JenisSimpanan,
				Jumlah = p_Jumlah, 
				CreatedUser = p_CreatedUser, 
				CreatedDate = v_CreatedDate
			WHERE IDPengambilan = p_IDPengambilan;
			
	END IF;
	
	COMMIT;
	SET p_Message = 'success';
    
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Penarikan_Simpanan_View`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Penarikan_Simpanan_View`(
	in p_Status varchar(10),
	IN p_DateFrom date,
	in p_DateTo date,
	in p_NoKaryawan varchar(50)
)
BEGIN
	SELECT IDPengambilan, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, b.NoRekening, ABS(Jumlah) as Jumlah, a.CreatedUser
	, a.CreatedDate, TanggalTransfer, NoRef, StatusTransaksi
	FROM T_Simpanan_Penarikan a inner join M_Anggota b on a.NoAnggota=b.NoAnggota
	WHERE a.StatusTransaksi = p_Status
	and (Tanggal between p_DateFrom and p_DateTo) 
	AND b.NoEmployee LIKE p_NoKaryawan 
	order by IDPengambilan desc;
	
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Log_View`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Log_View`(
	IN p_JenisSimpanan varchar(50),
	IN p_JenisPosting VARCHAR(50),
	IN p_DateFrom date,
	in p_DateTo date,
	in p_NoKaryawan varchar(50)
)
BEGIN
	SELECT IDTransaksi, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, a.JenisSimpanan, ABS(Jumlah) as Jumlah, a.CreatedUser, a.CreatedDate
	FROM T_Simpanan_Anggota a inner join M_Anggota b on a.NoAnggota=b.NoAnggota
	WHERE a.JenisSimpanan LIKE p_JenisSimpanan
	and a.JenisPosting = p_JenisPosting
	and (Tanggal between p_DateFrom and p_DateTo)
	AND b.NoEmployee LIKE p_NoKaryawan 
	order by IDTransaksi desc;
	
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Posting_Get`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Posting_Get`()
BEGIN
    -- Buat temporary table
    CREATE TEMPORARY TABLE T1 (
        NoAnggota VARCHAR(255) NOT NULL,
        NoEmployee VARCHAR(255) NOT NULL,
        Nama VARCHAR(255),
        SimpananPokok INT,
        SimpananWajib INT,
        SimpananSukarela INT,
        PRIMARY KEY (NoAnggota)
    );

    INSERT INTO T1 (NoAnggota, NoEmployee, Nama, SimpananPokok, SimpananWajib, SimpananSukarela)
    SELECT 
        `NoAnggota`,
        `NoEmployee`,
        `Nama`,
        CASE 
            WHEN `IsNew` = 1 THEN `SimpananPokok`
            WHEN `IsNew` = 0 THEN 0
        END AS SimpananPokok,
        `SimpananWajib`,
        `SimpananSukarela`
    FROM `M_Anggota`
    WHERE `JenisAnggota` = 'KARYAWAN' AND `StatusAnggota` <> 'RESIGN';
 
    -- Query 1: Data anggota
    SELECT 
        *,
        (`SimpananPokok` + `SimpananWajib` + `SimpananSukarela`) AS Total
    FROM T1
    ORDER BY `SimpananPokok` DESC, `NoEmployee` ASC;
 
    -- Query 2: Summary
	--     SELECT 
	--         COUNT(`NoEmployee`) AS TotalAnggota,
	--         IFNULL(SUM(`SimpananPokok`), 0) AS TotalSimpananPokok,
	--         IFNULL(SUM(`SimpananWajib`), 0) AS TotalSimpananWajib,
	--         IFNULL(SUM(`SimpananSukarela`), 0) AS TotalSimpananSukarela,
	--         (IFNULL(SUM(`SimpananPokok`), 0) + IFNULL(SUM(`SimpananWajib`), 0) + IFNULL(SUM(`SimpananSukarela`), 0)) AS TotalUangSimpanan
	--     FROM T1;
 
    -- Drop temporary table
    DROP TEMPORARY TABLE IF EXISTS T1;
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Posting_Get_Summary`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Posting_Get_Summary`(
    out TotalAnggota int,
    OUT TotalSimpananPokok INT,
    OUT TotalSimpananWajib INT,
    OUT TotalSimpananSukarela INT,
    out TotalSimpanan int
)
BEGIN
    -- Buat temporary table
    CREATE TEMPORARY TABLE T1 (
        NoAnggota VARCHAR(255) NOT NULL,
        SimpananPokok INT,
        SimpananWajib INT,
        SimpananSukarela INT,
        PRIMARY KEY (NoAnggota)
    );

    INSERT INTO T1 (NoAnggota, SimpananPokok, SimpananWajib, SimpananSukarela)
    SELECT 
        `NoAnggota`,
        CASE 
            WHEN `IsNew` = 1 THEN `SimpananPokok`
            WHEN `IsNew` = 0 THEN 0
        END AS SimpananPokok,
        `SimpananWajib`,
        `SimpananSukarela`
    FROM `M_Anggota`
    WHERE `JenisAnggota` = 'KARYAWAN' AND `StatusAnggota` <> 'RESIGN';

    SELECT 
	COUNT(`NoAnggota`) AS TotalAnggota,
	IFNULL(SUM(`SimpananPokok`), 0) AS TotalSimpananPokok,
	IFNULL(SUM(`SimpananWajib`), 0) AS TotalSimpananWajib,
	IFNULL(SUM(`SimpananSukarela`), 0) AS TotalSimpananSukarela,
	(IFNULL(SUM(`SimpananPokok`), 0) + IFNULL(SUM(`SimpananWajib`), 0) + IFNULL(SUM(`SimpananSukarela`), 0)) AS TotalUangSimpanan
    INTO TotalAnggota, TotalSimpananPokok, TotalSimpananWajib, TotalSimpananSukarela, TotalSimpanan    
    FROM T1;
 
    -- Drop temporary table
    DROP TEMPORARY TABLE IF EXISTS T1;
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Posting_Submit`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Posting_Submit`(
    IN p_Tanggal DATE,
    IN p_CreatedUser VARCHAR(50),
    OUT p_Message VARCHAR(4000)
)
BEGIN
    -- Get tanggal dan waktu saat ini
    DECLARE v_CreatedDate DATETIME;
    
    -- Deklarasi variable yang akan digunakan untuk insert ke table `T_Simpanan_Posting`
    DECLARE v_IDTransaksi VARCHAR(50);
    DECLARE v_TotalAnggota int;
    DECLARE v_TotalSimpananPokok int;
    declare v_TotalSimpananWajib int;
    declare v_TotalSimpananSukarela int;
    declare v_TotalSimpanan int;
        
    DECLARE v_sqlstate CHAR(5) DEFAULT NULL;
    DECLARE v_errno INT DEFAULT NULL;
    DECLARE v_text VARCHAR(255) DEFAULT NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Jika error, rollback
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE,
            v_errno = MYSQL_ERRNO,
            v_text = MESSAGE_TEXT;
    
        ROLLBACK;
        SET p_Message = CONCAT('Error ', v_errno, ' (', v_sqlstate, '): ', v_text);
    END;
 
    START TRANSACTION;
    
    SET time_zone = '+07:00';
    set v_CreatedDate = CURRENT_TIMESTAMP;
    
    -- buat IDTransaksi dari tanggal dan waktu saat ini
    SET v_IDTransaksi = DATE_FORMAT(v_CreatedDate, '%d%m%Y%H%i%s');
    
    -- Panggil stored procedure sp_Transaksi_Simpanan_Posting_Get_Summary 
    -- Untuk mendapatkan summary simpanan
    CALL sp_Transaksi_Simpanan_Posting_Get_Summary(v_TotalAnggota, 
    v_TotalSimpananPokok, v_TotalSimpananWajib, v_TotalSimpananSukarela, v_TotalSimpanan);
 
    -- Insert ke table T_Simpanan_Posting
    INSERT INTO T_Simpanan_Posting(
        IDTransaksi, Tanggal, TotalAnggota, TotalSimpananPokok, TotalSimpananWajib, 
        TotalSimpananSukarela, TotalSimpanan, CreatedUser, CreatedDate
    )
    VALUES(
        v_IDTransaksi, p_Tanggal, v_TotalAnggota, v_TotalSimpananPokok, 
        v_TotalSimpananWajib, v_TotalSimpananSukarela, v_TotalSimpanan, 
        p_CreatedUser, v_CreatedDate
    );
 
    -- Insert ke table T_Simpanan_Posting_Detail
    INSERT INTO T_Simpanan_Posting_Detail(
        IDTransaksi, NoAnggota, NoEmployee, SimpananPokok, SimpananWajib, SimpananSukarela
    )
    SELECT 
        v_IDTransaksi,
        NoAnggota,
        NoEmployee,
        CASE WHEN IsNew = 1 THEN SimpananPokok ELSE 0 END AS SimpananPokok,
        SimpananWajib,
        SimpananSukarela
    FROM M_Anggota
    WHERE JenisAnggota = 'KARYAWAN' AND StatusAnggota <> 'RESIGN';
 
    -- Insert ke table T_Simpanan_Anggota untuk simpanan pokok bagi anggota yang baru
    INSERT INTO T_Simpanan_Anggota(
        Tanggal, NoAnggota, JenisPosting, JenisTransaksi, JenisSimpanan, Jumlah, BulanAktif, CreatedUser, CreatedDate
    )
    SELECT 
        p_Tanggal,
        NoAnggota,
        'POSTING',
        'SETORAN',
        'SIMPANAN POKOK',
        SimpananPokok,
        0,
        p_CreatedUser,
        v_CreatedDate
    FROM M_Anggota
    WHERE JenisAnggota = 'KARYAWAN' AND StatusAnggota = 'BELUM AKTIF' AND IsNew = 1;
 
    -- Insert ke table T_Simpanan_Anggota untuk simpanan wajib
    INSERT INTO T_Simpanan_Anggota(
        Tanggal, NoAnggota, JenisPosting, JenisTransaksi, JenisSimpanan, Jumlah, BulanAktif, CreatedUser, CreatedDate
    )
    SELECT 
        p_Tanggal,
        NoAnggota,
        'POSTING',
        'SETORAN',
        'SIMPANAN WAJIB',
        SimpananWajib,
        1,
        p_CreatedUser,
        v_CreatedDate
    FROM M_Anggota
    WHERE JenisAnggota = 'KARYAWAN' AND StatusAnggota <> 'RESIGN' AND SimpananWajib > 0;
 
    -- Insert ke table T_Simpanan_Anggota untuk simpanan sukarela
    INSERT INTO T_Simpanan_Anggota(
        Tanggal, NoAnggota, JenisPosting, JenisTransaksi, JenisSimpanan, Jumlah, BulanAktif, CreatedUser, CreatedDate
    )
    SELECT 
        p_Tanggal,
        NoAnggota,
        'POSTING',
        'SETORAN',
        'SIMPANAN SUKARELA',
        SimpananSukarela,
        0,
        p_CreatedUser,
        v_CreatedDate
    FROM M_Anggota
    WHERE JenisAnggota = 'KARYAWAN' AND StatusAnggota <> 'RESIGN' AND SimpananSukarela > 0;
 
    -- Update anggota set IsNew menjadi 0 untuk yang IsNew 1
    UPDATE M_Anggota
    SET IsNew = 0, StatusAnggota = 'AKTIF'
    WHERE IsNew = 1 AND JenisAnggota = 'KARYAWAN' AND StatusAnggota = 'BELUM AKTIF';
 
    -- Update data M_AnggotaJasa set Tagihan menjadi Nol kembali
	--     UPDATE M_AnggotaJasa
	--     SET Tagihan = 0
	--     WHERE StatusJasa = 'OK';
 
    COMMIT;
    SET p_Message = 'Posting Simpanan Berhasil.';
    
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Posting_View`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Posting_View`(
	IN p_Tahun INT
)
BEGIN
    SELECT IDTransaksi, DATE_FORMAT(Tanggal, '%d-%b-%Y') AS Tanggal, TotalAnggota, TotalSimpananPokok, TotalSimpananWajib
    , TotalSimpananSukarela, TotalSimpanan, CreatedUser, DATE_FORMAT(CreatedDate, '%d-%b-%Y %H:%i:%s') as CreatedDate
    FROM `T_Simpanan_Posting`
    WHERE `Tanggal` >= CONCAT(p_Tahun, '-01-01')
      AND `Tanggal` <  CONCAT(p_Tahun + 1, '-01-01');
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Posting_View_Detail`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Posting_View_Detail`(
	IN p_IDTransaksi varchar(50)
)
BEGIN
    SELECT a.`NoAnggota`, a.`NoEmployee`, b.`Nama`, 
    a.`SimpananPokok`, a.`SimpananWajib`, a.`SimpananSukarela`,
    a.SimpananPokok + a.SimpananWajib + a.SimpananSukarela as TotalSimpanan
    FROM `T_Simpanan_Posting_Detail` a left join M_Anggota b on a.NoAnggota = b.NoAnggota
    WHERE IDTransaksi = p_IDTransaksi;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Tunai_Get`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Tunai_Get`(
	p_IDTransaksi BIGINT
)
BEGIN
	select IDTransaksi, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama, JenisSimpanan, Jumlah, BulanAktif
	from T_Simpanan_Anggota a inner join M_Anggota b on a.NoAnggota = b.NoAnggota
	where IDTransaksi = p_IDTransaksi;

END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Tunai_Submit`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Tunai_Submit`(
	p_IDTransaksi BIGINT,
	p_Tanggal DATE,	
	p_NoAnggota VARCHAR(10),
	p_JenisSimpanan VARCHAR(20),
	p_Jumlah INT,
	p_JumlahBulan INT,
	p_CreatedUser VARCHAR(50)
)
BEGIN
	IF p_IDTransaksi = 0 THEN
		INSERT INTO T_Simpanan_Anggota(
			Tanggal, 
			NoAnggota, 
			JenisPosting, 
			JenisTransaksi, 
			JenisSimpanan, 
			Jumlah, 
			BulanAktif, 
			CreatedUser, 
			CreatedDate
		)
		VALUES(
			p_Tanggal, 
			p_NoAnggota, 
			'MANUAL', 
			'SETORAN', 
			p_JenisSimpanan, 
			p_Jumlah, 
			p_JumlahBulan, 
			p_CreatedUser, 
			NOW()
		);
		
	ELSE
		UPDATE T_Simpanan_Anggota SET 
			Tanggal = p_Tanggal, 
			NoAnggota = p_NoAnggota, 
			JenisSimpanan = p_JenisSimpanan, 
			Jumlah = p_Jumlah, 
			BulanAktif = p_JumlahBulan, 
			CreatedUser = p_CreatedUser, 
			CreatedDate = NOW() 
		WHERE IDTransaksi = p_IDTransaksi;
	END IF;
END$$

DROP PROCEDURE IF EXISTS `sp_Transaksi_Simpanan_Tunai_View`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Transaksi_Simpanan_Tunai_View`(
	IN p_JenisSimpanan varchar(50),
	IN p_DateFrom date,
	in p_DateTo date,
	in p_NoKaryawan varchar(50)
)
BEGIN
	SELECT IDTransaksi, Tanggal, a.NoAnggota, b.NoEmployee, b.Nama
	, a.JenisSimpanan, ABS(Jumlah) as Jumlah, a.CreatedUser, a.CreatedDate
	FROM T_Simpanan_Anggota a inner join M_Anggota b on a.NoAnggota=b.NoAnggota
	WHERE JenisPosting = 'MANUAL' 
	and a.JenisTransaksi ='SETORAN' 
	and a.JenisSimpanan like p_JenisSimpanan 
	and (Tanggal between p_DateFrom and p_DateTo) 
	AND b.NoEmployee LIKE p_NoKaryawan 
	and b.StatusAnggota='AKTIF'
	order by IDTransaksi desc;
	
END$$

DROP PROCEDURE IF EXISTS `sp_Update_Setting_Simpanan`$$
SET SESSION sql_mode = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'$$
CREATE PROCEDURE `sp_Update_Setting_Simpanan`(
    IN p_SimpananPokok INT,
    IN p_SimpananWajib INT,
    IN p_SimpananSukarela INT
)
BEGIN
    UPDATE `M_Setting_Simpanan`
    SET
        SimpananPokok = p_SimpananPokok,
        SimpananWajib = p_SimpananWajib,
        SimpananSukarela = p_SimpananSukarela;
	
	update M_Anggota set SimpananWajib=p_SimpananWajib where StatusAnggota='AKTIF';

END$$

DELIMITER ;
SET SESSION sql_mode = DEFAULT;
