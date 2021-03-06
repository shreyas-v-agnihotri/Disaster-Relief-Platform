-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema Dubois_sp20
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema Dubois_sp20
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `Dubois_sp20` DEFAULT CHARACTER SET latin1 ;
USE `Dubois_sp20` ;

-- -----------------------------------------------------
-- Table `Dubois_sp20`.`NonProfits`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`NonProfits` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`NonProfits` (
  `NonProfitID` INT NOT NULL AUTO_INCREMENT,
  `NonProfitName` VARCHAR(80) NOT NULL,
  `NonProfitGuideStar` TINYINT NOT NULL DEFAULT 0,
  `NonProfitJoinDate` DATE NOT NULL,
  `NonProfitDescription` VARCHAR(200) NOT NULL,
  `NonProfitUsername` VARCHAR(80) NOT NULL,
  `NonProfitHashedPassword` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`NonProfitID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`Funds`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`Funds` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`Funds` (
  `FundID` INT NOT NULL AUTO_INCREMENT,
  `FundName` VARCHAR(80) NOT NULL,
  `FundDescription` VARCHAR(200) NOT NULL,
  `FundAccessible` TINYINT NOT NULL DEFAULT 0,
  `FundBalance` FLOAT NOT NULL,
  PRIMARY KEY (`FundID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`NonProfitFunds`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`NonProfitFunds` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`NonProfitFunds` (
  `NonProfitID` INT NOT NULL,
  `FundID` INT NOT NULL,
  PRIMARY KEY (`NonProfitID`, `FundID`),
  INDEX `fk_NonProfits_has_Funds_Funds1_idx` (`FundID` ASC),
  INDEX `fk_NonProfits_has_Funds_NonProfits_idx` (`NonProfitID` ASC),
  CONSTRAINT `fk_NonProfits_has_Funds_NonProfits`
    FOREIGN KEY (`NonProfitID`)
    REFERENCES `Dubois_sp20`.`NonProfits` (`NonProfitID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_NonProfits_has_Funds_Funds1`
    FOREIGN KEY (`FundID`)
    REFERENCES `Dubois_sp20`.`Funds` (`FundID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`Pledgers`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`Pledgers` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`Pledgers` (
  `PledgerID` INT NOT NULL AUTO_INCREMENT,
  `PledgerFirstName` VARCHAR(80) NOT NULL,
  `PledgerLastName` VARCHAR(80) NOT NULL,
  `PledgerJoinDate` DATE NOT NULL,
  `PledgerEmail` VARCHAR(80) NOT NULL,
  `PledgerPhoneNumber` BIGINT NOT NULL,
  `PledgerCreditCardNumber` BIGINT NOT NULL,
  `PledgerUsername` VARCHAR(80) NOT NULL,
  `PledgerHashedPassword` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`PledgerID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`Withdrawals`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`Withdrawals` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`Withdrawals` (
  `WithdrawalID` INT NOT NULL AUTO_INCREMENT,
  `WithdrawalAmount` FLOAT NOT NULL,
  `WithdrawalDateTime` DATETIME NOT NULL,
  `NonProfitID` INT NOT NULL,
  `FundID` INT NOT NULL,
  PRIMARY KEY (`WithdrawalID`, `NonProfitID`, `FundID`),
  INDEX `fk_Withdrawals_NonProfitFunds1_idx` (`NonProfitID` ASC, `FundID` ASC),
  CONSTRAINT `fk_Withdrawals_NonProfitFunds1`
    FOREIGN KEY (`NonProfitID` , `FundID`)
    REFERENCES `Dubois_sp20`.`NonProfitFunds` (`NonProfitID` , `FundID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`Pledges`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`Pledges` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`Pledges` (
  `PledgeID` INT NOT NULL AUTO_INCREMENT,
  `PledgeAmount` FLOAT NOT NULL,
  `PledgeDateTime` DATETIME NOT NULL,
  `PledgerID` INT NOT NULL,
  `FundID` INT NOT NULL,
  INDEX(`PledgeID`, `FundID`),
  PRIMARY KEY (`PledgeID`, `PledgerID`, `FundID`),
  FOREIGN KEY (`FundID`) REFERENCES `Dubois_sp20`.`Funds` (`FundID`),
  FOREIGN KEY (`PledgerID`) REFERENCES `Dubois_sp20`.`Pledgers` (`PledgerID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Dubois_sp20`.`Admins`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Dubois_sp20`.`Admins` ;

CREATE TABLE IF NOT EXISTS `Dubois_sp20`.`Admins` (
  `AdminID` INT NOT NULL AUTO_INCREMENT,
  `AdminUsername` VARCHAR(80) NOT NULL,
  `AdminHashedPassword` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`AdminID`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Triggers
-- -----------------------------------------------------
DELIMITER $$

CREATE TRIGGER HandlePledge
    AFTER INSERT
    ON `Dubois_sp20`.`Pledges` FOR EACH ROW
BEGIN
    UPDATE Funds
	SET FundBalance = FundBalance + NEW.PledgeAmount
	WHERE FundID = NEW.FundID;
END$$

CREATE TRIGGER HandleWithdrawal
    AFTER INSERT
    ON `Dubois_sp20`.`Withdrawals` FOR EACH ROW
BEGIN
    UPDATE Funds
	SET FundBalance = FundBalance - NEW.WithdrawalAmount
	WHERE FundID = NEW.FundID;
END$$

DELIMITER ; 

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
