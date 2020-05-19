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
	'admin',
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

INSERT INTO `Pledgers`(
    `PledgerFirstName`,
    `PledgerLastName`,
    `PledgerJoinDate`,
    `PledgerEmail`,
    `PledgerPhoneNumber`,
    `PledgerCreditCardNumber`,
    `PledgerUsername`,
    `PledgerHashedPassword`
)
VALUES(
	'Tim',
    'Pierson',
    date(20200101),
    'TimsFakeEmail@email.com',
    11231231234,
    1111111111111111,
    'tim',
    '$2b$10$rYRufcqKmeqodRb84tT5o.zrTt2sV1WofjYJm/ab1TzMqBfS4O.ge' # 'timspassword'
);

INSERT INTO `NonProfits`(
    `NonProfitName`,
    `NonProfitGuideStar`,
    `NonProfitJoinDate`,
    `NonProfitDescription`,
    `NonProfitUsername`,
    `NonProfitHashedPassword`
)
VALUES(
	'Red Cross',
    TRUE,
    date(20200101),
    'The description of the red cross.',
    'theredcrossiscool',
    '$2b$10$J.ZNeoFEaDWBx0C.Sav0fetYvQ3M8q0z2lPdaLPCk1Wqu5cmjRYlG' # 'redcrosspassword'
);


