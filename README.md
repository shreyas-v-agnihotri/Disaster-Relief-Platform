# 🦠 Disaster-Relief-Platform

A final project for COSC 061 (Database Systems) that creates a new model for pledging/using money for disaster relief.

## What it Does & Who it Serves

Our project is a demonstration of a new approach for how disaster-relief charities can fundraise money. Currently, when a disaster strikes (COVID-19, Haitian Earthquakes, Japanese Nuclear Meltdown) nonprofits have to rally volunteers and plan fundraisers in order to get money from donors to the sites in need. We propose a new framework that encourages donors to pledge credit towards disaster relief before the disaster strikes. In our demonstration, donors will be able to browse through a list of disaster-relief categories and pledge X amount of money towards any category that they want. These categories specify things like “Medical Supplies in case of Natural Disaster” or “Money to Support Medical Volunteers.” Each fund has a group of non-profits associated with the fund that have the privileges to access the money in times of need. When a disaster strikes, these funds will be opened to the associated non-profits and the donors will then be asked to commit to their pledge and donate the money. This new framework eliminates the time and resources it takes to gather donations during the time-sensitive period immediately after a disaster. Furthermore, if implemented properly, the donor will have greater transparency in how their donations are being used. 

## Major Entities Involved

* **Non-profit organizations/charities** (which sign up to the platform)
* **Funds** (separated by their purpose; these exist within this platform alone)
* **Pledgers** (any member of the general public who wants to donate)
* **Admins** (people who run this platform that update the list of disasters)

## Business Rules 

* Available Non-profit organizations must be verified on GuideStar (verified Boolean)
* Donors can pledge to any specific cause (fund/category of relief)
* Each fund must be activated in the event of least one disaster
* Each charity can pull from a fund only if they are in the same category and a disaster of that type has occurred

## Front-end

The front-end is written in Python as a command line-driven interface prompted by user input. It provides a means for a user/charity to log-in and select a fund to donate to/pull from. It also allows admins to mark that a given disaster has occurred, opening the ability for charities to request funds and prompting users to donate. 

