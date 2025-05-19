<?php
   require_once 'config.php';
   if($pdo) {
       echo "Koneksi database berhasil!";
   } else {
       echo "Koneksi database gagal!";
   }
   ?>