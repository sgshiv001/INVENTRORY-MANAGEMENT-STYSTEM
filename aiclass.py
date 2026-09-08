email = input("Enter your email address: ")

# Check the basic conditions
if ("@" in email and
    "." in email and
    " " not in email and
    email.find("@") > 0 and
    email.find("@") < email.rfind(".") and
    email.rfind("@") < len(email) - 1):

    print("Email is Valid")
else:
    print("Email is Invalid")