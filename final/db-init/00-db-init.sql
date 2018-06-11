-- MySQL dump 10.13  Distrib 5.7.22, for Linux (x86_64)
--
-- Host: localhost    Database: final
-- ------------------------------------------------------
-- Server version	5.7.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `beers`
--

DROP TABLE IF EXISTS `beers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `beers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `manufacturerid` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `abv` double NOT NULL,
  `ibu` int(11) NOT NULL,
  `calories` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_manufacturerid` (`manufacturerid`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beers`
--

LOCK TABLES `beers` WRITE;
/*!40000 ALTER TABLE `beers` DISABLE KEYS */;
INSERT INTO `beers` VALUES (1,10,'Pacifico',5.4,6,146,'Pilsner'),(2,1,'Fat Tire',5.2,22,160,'Belgian Style Ale'),(3,2,'VooDoo Ranger',7,50,160,'IPA'),(4,3,'Citradelic',6,50,170,'Tangerine IPA'),(5,4,'Juice Haze IPA',7.2,42,230,'IPA'),(6,5,'Coors Light',4.2,10,102,'Lager'),(7,6,'Guiness',4.2,45,125,'Stout'),(8,7,'Kiwanda',5.4,25,125,'Cream Ale'),(9,8,'Umbrella',7.4,60,160,'Pale Ale'),(10,9,'Tsunami',7,45,170,'stout');
/*!40000 ALTER TABLE `beers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manufacturers`
--

DROP TABLE IF EXISTS `manufacturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `manufacturers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `beerid` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `zip` int(11) NOT NULL,
  `phonenumber` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manufacturers`
--

LOCK TABLES `manufacturers` WRITE;
/*!40000 ALTER TABLE `manufacturers` DISABLE KEYS */;
INSERT INTO `manufacturers` VALUES (1,10,'Heineken','Portland','Oregon',97220,'5031234567'),(2,2,'Carlsberg','Bend','Oregon',97001,'5033214567'),(3,3,'Asahi','Corvallis','Oregon',97330,'5034444567'),(4,4,'Anheuser-Busch InBev','Eugene','Oregon',97401,'5035554567'),(5,5,'China Resources Snow Breweries','Tigad','Oregon',97224,'5036664567'),(6,6,'Molson Coors Brewing','Salem','Oregon',97301,'5037774567'),(7,7,'Tsingtao Brewery Group','Tualatin','Oregon',97305,'5038884567'),(8,8,'Yanjing','West Linn','Oregon',97036,'5039994567'),(9,9,'Kirin','Vancouver','Washington',98607,'5039999999');
/*!40000 ALTER TABLE `manufacturers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dollars` int(11) NOT NULL,
  `stars` double NOT NULL,
  `review` varchar(255) DEFAULT NULL,
  `userid` int(11) NOT NULL,
  `beerid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_beerid` (`beerid`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`beerid`) REFERENCES `beers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,4.5,'Cheap, delicious beer.',1,10),(2,2,3.5,'',2,1),(3,1,3.5,'Try the IPA.',3,2),(4,3,4.5,'Try the Pale Ale.',4,3),(5,3,5,'BEST BEER',5,4),(6,2,3,'Beer was okay',6,5),(7,2,3.5,'',7,6),(8,3,4.5,'',8,7),(9,1,2.5,'Bad Beer',9,8),(10,2,3.5,'',10,9),(11,1,5,'Cheap, not ideal.',1,22),(12,1,5,'Do not drink this',2,23),(13,1,5,'Try the IPA.',3,24),(14,2,5,'Try the Pale Ale.',4,22),(15,2,5,'BEST BEER',5,25),(16,2,4,'Beer was okay',6,32),(17,3,4,'Solid beer, but expensive',7,39),(18,3,4,'One of my favorite beers',8,42),(19,3,3,'Bad Beer',9, 51),(20,2,3,'ayy good beer',10,69),(21,1,3,'This beer is very expensive.',1,34),(22,1,3,'Too expensive',2,33),(23,1,3,'Not my favorite beer for the price.',3,51),(24,2,3,'Try a different beer.',4,52),(25,2,3,'this beer wasnt for me',5,53),(26,2,3,'it was okay',6,54),(27,1,3,'ehhhhh',8,55),(28,2,2,'Bad Beer',9,56),(29,2,2,'okay beer',10,57),(30,3,2,'One of my favorite beers',8,58),(31,3,2,'Bad Beer',9,31),(32,2,2,'ayy good beer',10,20),(33,1,2,'This beer is very expensive.',1,23),(34,1,1,'Too expensive',2,44),(35,1,1,'Not my favorite beer for the price.',3,45),(36,2,1,'Try a different beer.',4,66),(37,2,1,'this beer wasnt for me',5,54),(38,2,1,'it was okay',6,44),(39,1,1,'ehhhhh',8,41),(40,2,1,'Bad Beer', 9, 39),(41,2,1,'okay beer',10,38);


/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `userid` int(11) NOT NULL,
  `beerid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_beerid` (`beerid`),
  CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`beerid`) REFERENCES `beers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photos`
--

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` VALUES (1,'010101010011111','What a nice beer.',1,2), (2,'010101010011111','What a nice beer.',2,1), (3,'010101010011111','What an ugly beer.',3,5), (4,'010101010011111','What a sexy beer.',4,4), (5,'010101010011111','What a perfect beer.',5,6), (6,'010101010011111','What a joke of a beer.',6,10), (7,'010101010011111','What a mean beer.',7,8), (8,'010101010011111','What a nice beer.',8,9), (9,'010101010011111','What a sweet beer.',9,3);
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-06-07  2:04:43