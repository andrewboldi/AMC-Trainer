# Credits to ARay10 for lines 1-22
import random
amc = int(input("AMC 8, 10, or 12? Enter 0 for random"))
if amc == 0:
 amc = random.choice([8,10,12])
ab = True
if amc == 8:
 year = random.randint(2000,2019)
 ab = False
elif amc == 10 or amc == 12:
 year = random.randint(2000,2020)
 if year < 2002:
  ab = False
else:
 raise TypeError('Invalid AMC. Try inputting "0" for a random AMC, "8" for AMC 8, "10" for AMC 10, "12" for AMC 12')
problem = random.randint(1,25)
if ab == True:
 aorb = random.choice(["A","B"])
 link = "https://artofproblemsolving.com/wiki/index.php?title="+str(year)+"_AMC_"+str(amc)+str(aorb)+"_Problems/Problem_"+str(problem)
else:
 link = "https://artofproblemsolving.com/wiki/index.php?title="+str(year)+"_AMC_"+str(amc)+"_Problems/Problem_"+str(problem)
print(link)
# end credits

from requests import get
problem = get(link).text.replace("'", '"').replace(r"//latex.artofproblemsolving.com", "http://latex.artofproblemsolving.com")

problem = problem.split(r"</span></h2>")[1].split(r"<h2>")[0]
# problem = problem.split(r'<h2><span class="mw-headline" id="Problem">Problem</span></h2>')[1].split(r'<h2><span class="mw-headline"')[0]
f = open('randomAMC.html', 'wb')
message = f"""<html>
{problem}
</html>
"""

f.write(bytes(message, 'utf-8'))
import webbrowser as wb
wb.open(r"file://D:/pg/amc/randomAMC.html")
