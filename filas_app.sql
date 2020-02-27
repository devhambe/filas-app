-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 26, 2020 at 11:28 PM
-- Server version: 10.4.8-MariaDB
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `filas_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `balcoes`
--

CREATE TABLE `balcoes` (
  `id` int(11) NOT NULL,
  `numero` varchar(2) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `operador` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `balcoes`
--

INSERT INTO `balcoes` (`id`, `numero`, `estado`, `operador`) VALUES
(2, '2', 0, 25),
(4, '1', 1, 24);

-- --------------------------------------------------------

--
-- Table structure for table `niveis`
--

CREATE TABLE `niveis` (
  `id` int(11) NOT NULL,
  `perm` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `niveis`
--

INSERT INTO `niveis` (`id`, `perm`) VALUES
(1, 'Admin'),
(2, 'Operador');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `nivel` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nome`, `email`, `password`, `nivel`) VALUES
(2, 'admin', 'admin@admin.com', '$2b$10$0vPhHpAH5NraHHhKU4mEseWxwaowoaQnMc9NHJPO2h8bAoIoz3cD6', 1),
(3, 'operadorteste', 'operador@test.com', '$2b$10$fd5O.kzezWybQErgYAg8EuVsD50Jx9Ip867BNoKGHhvW3bAzyKAde', 2),
(24, 'novooperador', 'aa@sa', '$2b$10$6bO7jXB2b84ZCRoACf5gH.Yus/UdWSrUBlFD4Uez0OxKBqaTwfKwy', 2),
(25, '555', 'adalberto@email.com', '$2b$10$LJlYimR1FW4V7EGwPdLA1.Ym1yiZARj82S0wG0ttOY7EHIghB6RIa', 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `balcoes`
--
ALTER TABLE `balcoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `operador` (`operador`);

--
-- Indexes for table `niveis`
--
ALTER TABLE `niveis`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `nivel` (`nivel`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `balcoes`
--
ALTER TABLE `balcoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `niveis`
--
ALTER TABLE `niveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `balcoes`
--
ALTER TABLE `balcoes`
  ADD CONSTRAINT `balcoes_ibfk_1` FOREIGN KEY (`operador`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`nivel`) REFERENCES `niveis` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
