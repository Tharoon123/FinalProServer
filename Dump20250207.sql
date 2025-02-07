-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: banking
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` int DEFAULT NULL,
  `AMOUNT` decimal(10,2) DEFAULT '0.00',
  `STATUS` tinyint(1) DEFAULT '0',
  `LOCATION` varchar(45) DEFAULT NULL,
  `TIME` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,100.00,1,'7.1041024,80.0653312','2025-01-06 04:51:39'),(2,2,4.99,0,'7.0074134,79.9617991','2025-01-06 04:53:02'),(3,1,5.99,1,'location_error','2025-01-16 13:27:38'),(4,1,4.99,1,'location_error','2025-02-03 04:14:22'),(5,1,6.99,1,'location_error','2025-02-03 05:11:20'),(6,1,4.99,1,'location_error','2025-02-03 05:15:46'),(7,1,3.49,1,'location_error','2025-02-03 05:20:31'),(8,1,4.99,1,'location_error','2025-02-03 05:45:00'),(9,1,6.99,1,'location_error','2025-02-03 05:48:03'),(10,1,6.99,1,'location_error','2025-02-03 05:48:34'),(11,1,4.99,1,'location_error','2025-02-04 08:02:58'),(12,1,4.99,1,'location_error','2025-02-04 08:05:25'),(13,1,4.99,1,'location_error','2025-02-04 08:14:42'),(14,1,100.00,0,'location_error','2025-02-04 08:15:13');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userdata`
--

DROP TABLE IF EXISTS `userdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userdata` (
  `USER_ID` int NOT NULL AUTO_INCREMENT,
  `NAME` varchar(45) DEFAULT NULL,
  `NUMBER` varchar(200) DEFAULT NULL,
  `EXPIRE_DATE` varchar(45) DEFAULT NULL,
  `CVV` varchar(200) DEFAULT NULL,
  `IMAGE` varchar(1500) DEFAULT NULL,
  `BALANCE` decimal(10,2) DEFAULT '0.00',
  `USERNAME` varchar(45) DEFAULT NULL,
  `PASSWORD` varchar(200) DEFAULT NULL,
  `IDNUM` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userdata`
--

LOCK TABLES `userdata` WRITE;
/*!40000 ALTER TABLE `userdata` DISABLE KEYS */;
INSERT INTO `userdata` VALUES (1,'Tharoon Naveedya','8904b738b8b36c33a0d4bd0cbf6cef48:4299875b6ae0b38e3171bde3bc4990daa0e018719959c8fd791c1f8535409745','11/11','ff461a0dfcaa92fbf30b0fbc4c9d4051:75b80db1b90de52c52571edfad17c43b','image-1738656289703-28893535.jpg',9990.02,'Tharoonc007','85bf35a3f5bbd28c23a976a42b92e3b8:0d2c59d14add09b1603c235d28c9f1f0','dd759ad9ad1aa503d0776bc55f30280b:1564c4aec0d48c4e6dea60de290b3a2e');
/*!40000 ALTER TABLE `userdata` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-07 22:25:18
