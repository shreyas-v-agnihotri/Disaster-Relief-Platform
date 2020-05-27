
#
# Client side to fetch data from a RESTful API. 
# on the server side.
# Author: Mike Zhou, Shreyas Agnihotri, Thanh Nyugen, Ayan Agarwal; Dartmouth CS61, Spring 2020
# Requires installation of mysql connector: pip install mysql-connector-python
# 	also requires Requests: pip install requests
# Based on: https://dev.mysql.com/doc/connector-python/en/connector-python-example-connecting.html
#
# Usage: python3 call_api.py
# Assumes Node.js file api is running (nodemon api.js <localhost|sunapee>)
# Also assumes database table has been created (code in Lab 3.sql)
# Allows access to database through command line interface
#

import requests
import json

api = 'http://localhost:3000/api/'

# Converts any passed arguments into JSON (dictionary) form, removing any blank entries
def createJSON(**args):
	return {key:val for key, val in args.items() if val != ''}

# Makes read request with passed body
def make_get_call(url, data):
	resp = requests.get(url, json=data)
	return resp.json()

# Makes create request with passed body
def make_post_call(url, data):
	resp = requests.post(url, json=data)
	return resp.json()

# Makes update request with passed body
def make_put_call(url, data):
	resp = requests.put(url, json=data)
	return resp.json()

# Makes delete request with passed body
def make_delete_call(url, data):
	resp = requests.delete(url, json=data)
	return resp.json()

# Runs command line prompts
if __name__ == '__main__':
	# Determine whether program should continue
	continueProgram = True
	while continueProgram:

		# Sign user in
		AuthUsername = input("\nUsername:\n> ")
		AuthPassword = input("\nPassword:\n> ")

		auth_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
		role_resp = make_get_call(api + "role/", auth_body) # get back the role
		if role_resp["status"] != 200: # have the user retry signing 
			print("Username or Password incorrect. Try again please.\n")
			continue 

		role = role_resp["response"]

		# Determine whether user should stay logged in
		loggedIn = True
		while loggedIn:
			# Display list of funds and prompt Admin to make fund accessible
			if role == "Admin":
				# Print list of funds for admin to see
				funds_list = make_get_call(api + "funds", auth_body)
				
				fund_ids_set = set() # help validate existing fund later
				print("\nFunds: ")
				for fund in funds_list['response']:
					fund_ids_set.add(str(fund['FundID']))
					print(f"Fund ID: {fund['FundID']} \nFund Name: {fund['FundName']} \nFund Description: {fund['FundDescription']} \nFund Accessible: {bool(fund['FundAccessible'])} \nFund Balance: {fund['FundBalance']}")
				
				# get fund_id and change to accessibility from admin
				fund_id = float('-inf')
				while fund_id not in fund_ids_set:
					fund_id = input("\nPlease enter a fund ID to switch on/off\n> ")
				fund_accessible = -1
				while fund_accessible != "0" and fund_accessible != "1":
					fund_accessible = input("\nEnter 0 to turn off accessibility, 1 to turn on\n> ")

				# make the call
				toggle_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword, FundAccessible = fund_accessible)
				resp = make_put_call(api + "funds/" + fund_id, toggle_body) 
				
				if resp["status"] != 200:
					print("Error. Please try again.")
				else:
					print(f"\nSuccess! Modified fund {fund_id} and set accessibility to {bool(fund_accessible)}")

				endingAction = 0
				while endingAction not in range(1, 4):
					endingAction = int(input("\nEnter a number to select an action:\n"
						+ "1 - Make another query\n"
						+ "2 - Go back to log-in\n" 
						+ "3 - Quit this program\n> "
					))

				# Process exiting out of necessary loops
				if endingAction == 1:
					loggedIn = True
				if endingAction == 2:
					loggedIn = False
				if endingAction == 3:
					loggedIn = False
					continueProgram = False

			
			elif role == "Pledger":
				# Print list of funds for pledger to see
				funds_list = make_get_call(api + "funds", auth_body)
				fund_ids_set = set() # help validate existing fund later
				print("\nFunds: ")
				for fund in funds_list['response']:
					fund_ids_set.add(str(fund['FundID']))
					print(f"Fund ID: {fund['FundID']} \nFund Name: {fund['FundName']} \nFund Description: {fund['FundDescription']}")

				# get fund_id and amount to donate from user
				fund_id = float('-inf')
				while fund_id not in fund_ids_set:
					fund_id = input("\nPlease select a fund ID to donate to\n> ")
				amount = -1
				while amount <= 0:
					amount = round(float(input("\nPlease enter an amount to donate: \n> ")), 2)
				pledges_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword, FundID = fund_id, Amount = amount)
				print(make_put_call(api + "pledges/" + fund_id, pledges_body))

				endingAction = 0
				while endingAction not in range(1, 4):
					endingAction = int(input("\nEnter a number to select an action:\n"
						+ "1 - Make another query\n"
						+ "2 - Go back to log-in\n" 
						+ "3 - Quit this program\n> "
					))

				# Process exiting out of necessary loops
				if endingAction == 1:
					loggedIn = True
				if endingAction == 2:
					loggedIn = False
				if endingAction == 3:
					loggedIn = False
					continueProgram = False


			else: # role == "NonProfit"
				# Show funds that the nonprofit can access
				print(make_put_call(api + "nonprofitfunds/", auth_body))

				# get fund_id and amount to withdraw from nonprofit
				fund_id = float('-inf')
				while fund_id not in fund_ids_set:
					fund_id = input("\nPlease enter a fund ID to switch on/off\n> ")
				amount = -1
				while amount < 0:
					amount = round(float(input("\nPlease enter an amount to donate: \n> ")), 2)
				withdrawal_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword, FundID = fund_id, Amount = amount)

				print(make_put_call(api + "withdrawals/", withdrawal_body)) 

				endingAction = 0
				while endingAction not in range(1, 4):
					endingAction = int(input("\nEnter a number to select an action:\n"
						+ "1 - Make another query\n"
						+ "2 - Go back to log-in\n" 
						+ "3 - Quit this program\n> "
					))

				# Process exiting out of necessary loops
				if endingAction == 1:
					loggedIn = True
				if endingAction == 2:
					loggedIn = False
				if endingAction == 3:
					loggedIn = False
					continueProgram = False




			

			# # GET (all)
			# if querySelection == 1:
			# 	body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
			# 	print("\n", make_get_call(api, body))

			# # GET (specific)
			# if querySelection == 2:
			# 	IdSelection = int(input("\nEmployee ID to search for:\nInput an integer\n> "))
			# 	body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
			# 	print("\n", make_get_call(api + str(IdSelection), body))

			# # PUT
			# if querySelection == 3:
			# 	IdSelection = int(input("\nEmployee ID to update:\nInput an integer\n> "))

			# 	Username = input("\nNew username\n(Enter to skip)\n> ")
			# 	Password = input("\nNew password\n(Enter to skip)\n> ")
			# 	Name = input("\nNew name\n(Enter to skip)\n> ")
			# 	IsAdmin = input("\nIs an administrator?\nInput 'true' or 'false'\n(Enter to skip)\n> ")
			# 	Salary = input("\nNew salary\nInput an integer\n(Enter to skip)\n> ")

			# 	if Salary: Salary = int(Salary)
			# 	if IsAdmin == "true": IsAdmin = True
			# 	if IsAdmin == "false": IsAdmin = False

			# 	body = createJSON(AuthUsername = AuthUsername, 
			# 										AuthPassword = AuthPassword, 
			# 										Username = Username, 
			# 										Password = Password, 
			# 										Name = Name, 
			# 										IsAdmin = IsAdmin, 
			# 										Salary = Salary)
			# 	print("\n", make_put_call(api + str(IdSelection), body))

			# # POST
			# if querySelection == 4:
			# 	print("\nCreating new employee entry\n")
			# 	Username = input("\nUsername\n> ")
			# 	Password = input("\nPassword\n> ")
			# 	Name = input("\nName\n> ")
			# 	IsAdmin = input("\nIs an administrator?\nInput 'true' or 'false'\n> ")
			# 	Salary = input("\nSalary\nInput an integer\n(Enter to skip)\n> ")

			# 	if Salary: Salary = int(Salary)
			# 	if IsAdmin == "true": IsAdmin = True
			# 	if IsAdmin == "false": IsAdmin = False

			# 	body = createJSON(AuthUsername = AuthUsername, 
			# 										AuthPassword = AuthPassword, 
			# 										Username = Username, 
			# 										Password = Password, 
			# 										Name = Name, 
			# 										IsAdmin = IsAdmin, 
			# 										Salary = Salary)
			# 	print("\n", make_post_call(api, body))

			# # DELETE
			# if querySelection == 5:
			# 	IdSelection = int(input("\nEmployee ID to delete:\nInput an integer\n> "))

			# 	body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
			# 	print("\n", make_delete_call(api + str(IdSelection), body))

	
	# Add spacer before returning to bash prompt
	print("")