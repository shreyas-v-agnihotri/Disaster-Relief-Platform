
#
# Client side to fetch data from a RESTful API. 
# on the server side.
# Author: Shreyas Agnihotri, Dartmouth CS61, Spring 2020
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

api = 'http://localhost:3000/api/employees/'

# Converts any passed arguments into JSON (dictionary) form, removing any blank entries
def createJSON(**args):
	return {key:val for key, val in args.items() if val != ''}

# Makes read request with passed body
def make_get_call(url, data):
	resp = requests.get(url, json=data)
	return json.dumps(resp.json(), indent=2)

# Makes create request with passed body
def make_post_call(url, data):
	resp = requests.post(url, json=data)
	return json.dumps(resp.json(), indent=2)

# Makes update request with passed body
def make_put_call(url, data):
	resp = requests.put(url, json=data)
	return json.dumps(resp.json(), indent=2)

# Makes delete request with passed body
def make_delete_call(url, data):
	resp = requests.delete(url, json=data)
	return json.dumps(resp.json(), indent=2)

# Runs command line prompts
if __name__ == '__main__':

	# Determine whether program should continue
	continueProgram = True
	while continueProgram:

		# Sign user in
		AuthUsername = input("\nUsername:\n> ")
		AuthPassword = input("\nPassword:\n> ")

		# Determine whether user should stay logged in
		loggedIn = True
		while loggedIn:
			
			# Prompt user to select specific CRUD operation
			querySelection = 0
			while querySelection not in range(1, 6):
				querySelection = int(input("\nEnter a number to select an action:\n"
					+ "1 - Search for all employees\n"
					+ "2 - Search for an employee by ID\n" 
					+ "3 - Update an employee by ID\n" 
					+ "4 - Create an employee\n" 
					+ "5 - Delete an employee by ID\n> " 
				))

			# GET (all)
			if querySelection == 1:
				body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
				print("\n", make_get_call(api, body))

			# GET (specific)
			if querySelection == 2:
				IdSelection = int(input("\nEmployee ID to search for:\nInput an integer\n> "))
				body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
				print("\n", make_get_call(api + str(IdSelection), body))

			# PUT
			if querySelection == 3:
				IdSelection = int(input("\nEmployee ID to update:\nInput an integer\n> "))

				Username = input("\nNew username\n(Enter to skip)\n> ")
				Password = input("\nNew password\n(Enter to skip)\n> ")
				Name = input("\nNew name\n(Enter to skip)\n> ")
				IsAdmin = input("\nIs an administrator?\nInput 'true' or 'false'\n(Enter to skip)\n> ")
				Salary = input("\nNew salary\nInput an integer\n(Enter to skip)\n> ")

				if Salary: Salary = int(Salary)
				if IsAdmin == "true": IsAdmin = True
				if IsAdmin == "false": IsAdmin = False

				body = createJSON(AuthUsername = AuthUsername, 
													AuthPassword = AuthPassword, 
													Username = Username, 
													Password = Password, 
													Name = Name, 
													IsAdmin = IsAdmin, 
													Salary = Salary)
				print("\n", make_put_call(api + str(IdSelection), body))

			# POST
			if querySelection == 4:
				print("\nCreating new employee entry\n")
				Username = input("\nUsername\n> ")
				Password = input("\nPassword\n> ")
				Name = input("\nName\n> ")
				IsAdmin = input("\nIs an administrator?\nInput 'true' or 'false'\n> ")
				Salary = input("\nSalary\nInput an integer\n(Enter to skip)\n> ")

				if Salary: Salary = int(Salary)
				if IsAdmin == "true": IsAdmin = True
				if IsAdmin == "false": IsAdmin = False

				body = createJSON(AuthUsername = AuthUsername, 
													AuthPassword = AuthPassword, 
													Username = Username, 
													Password = Password, 
													Name = Name, 
													IsAdmin = IsAdmin, 
													Salary = Salary)
				print("\n", make_post_call(api, body))

			# DELETE
			if querySelection == 5:
				IdSelection = int(input("\nEmployee ID to delete:\nInput an integer\n> "))

				body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword)
				print("\n", make_delete_call(api + str(IdSelection), body))

			# Prompt user to decide how to continue after query
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
	
	# Add spacer before returning to bash prompt
	print("")