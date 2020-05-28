# Final Project
# Ayan Agarwal, Michael Zhou, Shreyas Agnihotri, Thanh Nguyen Jr
# Professor Pierson
# CS61, Spring 2020, Dartmouth College
USE Dubois_sp20;

-- Admins

INSERT INTO `Admins`(
    `AdminUsername`,
    `AdminHashedPassword`
)
VALUES(	 # add some admin users that can modify the data base from the beginning
	'admin',
    '$2b$10$g3K2sTwrNoe7CD4QELI2DehXL/11yM83RZ5CxTsVglQGBTHJF1qq.' # 'password' hashed
);

-- Funds

INSERT INTO `Funds`(
    `FundName`,
    `FundDescription`,
    `FundAccessible`,
    `FundBalance`
)
VALUES(
	'Earthquake Relief',
    'Used for rebuilding and victim aid after large-scale earthquakes, above 7.0 on the Richter Scale',
    TRUE,
    1000.00
), (
	'Disease Relief',
    'Used to aid hospitals and fund research to fight widespread pandemics like COVID-19',
    FALSE,
    1000.00
), (
	'Climate Change',
    'Used to actively fight the effects of climate change, whether rising temperatures or sea level.',
    TRUE,
    1000.00
);

-- Pledgers

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

-- NonProfits

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
    'Humanitarian organization that provides emergency assistance, disaster relief, and disaster preparedness education in the United States.',
    'redcross',
    '$2b$10$J.ZNeoFEaDWBx0C.Sav0fetYvQ3M8q0z2lPdaLPCk1Wqu5cmjRYlG' # 'redcrosspassword'
), (
	'Gates Foundation',
    TRUE,
    date(20200101),
    'The primary goals of the foundation are, globally, to enhance healthcare and reduce extreme poverty, and, in the U.S., to expand educational opportunities and access to information technology.',
    'gatesfoundation',
    '$2a$10$WiHGq2U7iQzzqrvpmYDpx.30krIhJrJXifQRfch7Van/Un0p7Etn6' # 'gatespassword'
);

-- NonProfitFunds

INSERT INTO `NonProfitFunds`(
	`NonProfitID`,
    `FundID`
)
VALUES
	(1, 1), 
    (1, 2),
	(1, 3),
    (2, 3);

