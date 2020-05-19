# Final Project
# Ayan Agarwal, Michael Zhou, Shreyas Agnihotri, Thanh Nguyen Jr
# Professor Pierson
# CS61, Spring 2020, Dartmouth College
USE Dubois_sp20;

INSERT INTO `Admins`(
    `AdminUsername`,
    `AdminHashedPassword`
)
VALUES(	 # add some admin users that can modify the data base from the beginning
	'thanh',
    '$2b$10$g3K2sTwrNoe7CD4QELI2DehXL/11yM83RZ5CxTsVglQGBTHJF1qq.' # 'password' hashed
);

INSERT INTO `Funds`(
    `FundName`,
    `FundDescription`,
    `FundAccessible`,
    `FundBalance`
)
VALUES(
	'Test Fund',
    'This is the description of the test fund.',
    FALSE,
    1000
);


