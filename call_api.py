#
# Client side to fetch data from a RESTful API. 
# on the server side.
# Author: Mike Zhou, Shreyas Agnihotri, Thanh Nguyen, Ayan Agarwal; Dartmouth CS61, Spring 2020
# Requires installation of mysql connector: pip install mysql-connector-python
# 	also requires Requests: pip install requests
# Based on: https://dev.mysql.com/doc/connector-python/en/connector-python-example-connecting.html
#
# Usage: python3 call_api.py
# Assumes Node.js file api is running (nodemon api.js <localhost|sunapee>)
# Also assumes database table has been created (code in ResetSchemaDubois.sql and InitializeTables.sql)
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

# Final prompt allowing user to continue/logout/terminate
def ending_actions():
	endingAction = 0
	while endingAction not in range(1, 4):
		endingAction = int(input("\nEnter a number to select how to continue:\n"
			+ "1 - Perform another action\n"
			+ "2 - Log out\n" 
			+ "3 - Quit this program\n> "
		))

	# Process exiting out of necessary loops
	if endingAction == 1:
		loggedIn = True
		continueProgram = True
	if endingAction == 2:
		loggedIn = False
		continueProgram = True
	if endingAction == 3:
		loggedIn = False
		continueProgram = False
	return (continueProgram, loggedIn)

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
			print("\n" + role_resp["error"])
			continue 

		role = role_resp["response"]["role"]
		AuthID = role_resp["response"]["ID"]

		# Determine whether user should stay logged in
		loggedIn = True
		while loggedIn:
			# Display list of funds and prompt Admin to make fund accessible
			if role == "Admin":
		
				action = 0
				while action not in range(1, 8):
					action = int(input("\nPress 1 to see funds\n"
						+ "Press 2 to see nonprofits\n"
						+ "Press 3 to see pledgers\n"
						+ "Press 4 to see admins\n"
						+ "Press 5 to see pledges\n"
						+ "Press 6 to see withdrawals\n"
						+ "Press 7 to make a fund accessible/inaccessible\n> "))

				if action == 1: # see funds
					funds_list = make_get_call(api + "funds", auth_body)
					
					print("\nFunds:")
					for fund in funds_list['response']:
						print(f"\nFund ID: {fund['FundID']}\nFund Name: {fund['FundName']}\nFund Description: {fund['FundDescription']}\nFund Accessible: {bool(fund['FundAccessible'])}\nFund Balance: ${fund['FundBalance']}")

				elif action == 2: # see nonprofits
					nonprofits_list = make_get_call(api + "nonprofits", auth_body)
					print("Nonprofits:")
					for nonprofit in nonprofits_list['response']:
						print(f"\nNonprofit ID: {nonprofit['NonProfitID']}\nNonprofit Name: {nonprofit['NonProfitName']}\nNonprofit GuideStar: {nonprofit['NonProfitGuideStar']}\nNonprofit Join Date: {nonprofit['NonProfitJoinDate']}\nNonprofit Description: {nonprofit['NonProfitDescription']}")
					
				elif action == 3: # see pledgers
					pledgers_list = make_get_call(api + "pledgers", auth_body)
					
					print("\nPledgers:")
					for pledger in pledgers_list['response']:
						print(f"\nPledger ID: {pledger['PledgerID']}\nPledger First Name: {pledger['PledgerFirstName']}\nPledger Last Name: {pledger['PledgerLastName']}\nPledger Join Date: {pledger['PledgerJoinDate']}\nPledger Email: {pledger['PledgerEmail']}\nPledger Phone Number: ***-***-{pledger['PledgerPhoneNumber'] % 10000}\nPledger Credit Card Number: ****-****-****-{pledger['PledgerCreditCardNumber'] % 10000}")

				elif action == 4: #see admins
					admins_list = make_get_call(api + "admins", auth_body)

					print("\nAdmins:")
					for admin in admins_list['response']:
						print(f"\nAdmin ID: {admin['AdminID']}\nAdmin Username: {admin['AdminUsername']}")

				elif action == 5: #see pledges
					pledges_list = make_get_call(api + "pledges", auth_body)
					
					print("\nPledges:")
					for pledge in pledges_list['response']:
						print(f"\nPledge ID: {pledge['PledgeID']}\nPledge Amount: ${pledge['PledgeAmount']}\nPledge Date Time: {pledge['PledgeDateTime']}\nPledger ID: {pledge['PledgerID']}\nFund ID: {pledge['FundID']}")

				elif action == 6: # see withdrawals
					withdrawals_list = make_get_call(api + "withdrawals", auth_body)
					print("\nWithdrawals:")
					for withdrawal in withdrawals_list['response']:
						print(f"\nWithdrawal ID: {withdrawal['WithdrawalID']}\nWithdrawal Amount: ${withdrawal['WithdrawalAmount']}\nWithdrawal Date Time: {withdrawal['WithdrawalDateTime']}\nNonprofit ID: {withdrawal['NonProfitID']}\nFund ID: {withdrawal['FundID']}")

				else: # action == 7 # change fund's accessibility
					funds_list = make_get_call(api + "funds", auth_body)
					
					fund_ids_set = set() # help validate existing fund later
					print("\nFunds:")
					for fund in funds_list['response']:
						fund_ids_set.add(str(fund['FundID']))
						print(f"\nFund ID: {fund['FundID']}\nFund Name: {fund['FundName']}\nFund Description: {fund['FundDescription']}\nFund Accessible: {bool(fund['FundAccessible'])}\nFund Balance: {fund['FundBalance']}")
					
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
						print(resp["error"])
					else:
						print(f"\nSuccess! Modified fund {fund_id} and set accessibility to {bool(fund_accessible)}")

				(continueProgram, loggedIn) = ending_actions()

			
			elif role == "Pledger":

				# Print list of funds for pledger to see
				funds_list = make_get_call(api + "funds", auth_body)
				fund_ids_set = set() # help validate existing fund later
				print("\nFunds:")
				for fund in funds_list['response']:
					fund_ids_set.add(str(fund['FundID']))
					print(f"\nFund ID: {fund['FundID']}\nFund Name: {fund['FundName']}\nFund Description: {fund['FundDescription']}")

				# get fund_id and amount to donate from user
				fund_id = float('-inf')
				while fund_id not in fund_ids_set:
					fund_id = input("\nPlease select a fund ID to donate to\n> ")
				amount = -1
				while amount <= 0:
					amount = round(float(input("\nPlease enter an amount to donate: \n> ")), 2)
				pledges_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword, FundID = fund_id, PledgeAmount = amount)
				
				pledges_resp = make_post_call(api + "pledges/", pledges_body)
				if pledges_resp["status"] != 200:
					print(pledges_resp["error"])
				else:
						print(f"\nSuccess! Added ${amount} to fund {fund_id}")

				(continueProgram, loggedIn) = ending_actions()


			elif role == "NonProfit":

				# Show funds that the nonprofit can access
				funds_list = make_get_call(api + "nonprofitfunds/", auth_body)
				fund_ids_dict = {} # help validate existing fund later # map ID to amount for easy access later
				print("\nAccessible Funds:")
				for fund in funds_list['response']:
					fund_ids_dict[str(fund['FundID'])] = float(fund['FundBalance'])
					print(f"\nFund ID: {fund['FundID']}\nFund Name: {fund['FundName']}\nFund Description: {fund['FundDescription']}\nFund Balance: {fund['FundBalance']}")

				# get fund_id and amount to withdraw from nonprofit
				fund_id = float('-inf')
				while fund_id not in fund_ids_dict:
					fund_id = input("\nPlease enter a fund ID to withdraw from\n> ")
				amount = -1
				while amount <= 0 or amount > fund_ids_dict[fund_id]:
					amount = round(float(input("\nPlease enter an amount to withdraw: \n> ")), 2)
				withdrawal_body = createJSON(AuthUsername = AuthUsername, AuthPassword = AuthPassword, FundID = fund_id, WithdrawalAmount = amount)

				withdrawal_resp = make_post_call(api + "withdrawals/", withdrawal_body)
				if withdrawal_resp["status"] != 200:
					print(withdrawal_resp["error"])
				else:
					print(f"\nSuccess! Withdrew ${amount} from fund {fund_id}")

				(continueProgram, loggedIn) = ending_actions()
	
	# Add spacer before returning to bash prompt
	print("")