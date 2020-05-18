USE nyc_inspections;

-- Create an Employees table in your nyc_inspections schema to track the Health Inspectors, 
-- you pick the attributes, but they should be what you would expect an organization to track 
-- about its employees including: 
-- date of hire, salary, and whether the Inspector has admin privileges. 
-- You'll also want to store each Inspector's username and password.
DROP TABLE IF EXISTS Employees;
CREATE TABLE Employees(
	ID BIGINT NOT NULL AUTO_INCREMENT,
	Username VARCHAR(255) UNIQUE NOT NULL, 
	Password VARCHAR(255) NOT NULL, 
    Name VARCHAR(255) NOT NULL,
    IsAdmin BOOL NOT NULL,
    DateHired DATE,
    Salary INT,
	PRIMARY KEY (ID)
);

-- Create a new database user that your API will use to access the database, 
-- give this user the minimal needed permissions necessary to carry out the API methods
ALTER USER 'cs61'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON nyc_inspections.Employees TO 'cs61'@'localhost';
FLUSH PRIVILEGES;