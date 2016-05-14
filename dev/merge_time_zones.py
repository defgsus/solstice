from __future__ import print_function
import dbf

t = dbf.Table("ne_10m_time_zones.dbf")

zones = dict()

k = 0
for i in t:
	key = float(i.name);
	try:
		a = zones[key]
		a.append(k)
	except KeyError:
		a = [k]
		zones[key] = a
	k += 1

print("num: " + str(len(zones)))	

zoneSorted = sorted(zones)
zoneIndex = dict()
k = 0
for z in zoneSorted:
	zoneIndex[z] = k
	k += 1;

def printMerged():
	for z in zoneSorted:
		print(str(z) + " " + str(zones[z]))


def printCode():

	print("//---")
	for z in zoneSorted:
		print("if (", end="");
		first = True
		for i in zones[z]:
			if first: first = False 
			else: print(" || ", end="");
			print("idx == " + str(i), end="");
		print(") { name = " + str(z) + "; timeZone = " + str(zoneIndex[z]) + "; }")

def utcString(z):
	"""convert a float z to UTC+/-x string"""
	if z == 0: return "UTC(0)"
	s = "UTC"
	if z >= 0: s += "+"
	h = int(z)
	s += str(h) 
	if h == z: return s
	s = s + ":"
	m = int((abs(z) - abs(h)) * 60)
	s += str(m)
	return s# + "(" + str(z) + ")"
	
def printHtmlSelect():
	print("<select>");
	for z in zoneSorted:
		print("<option>" + utcString(z) + "</option>");
	print("</select>");

def printFloatArray():
	print("times = [", end="");
	first = True
	for z in zoneSorted:
		if first: first = False 
		else: print(", ", end="")
		print(str(z), end="")
	print("];")
	
#printMerged()
#printCode()
#printHtmlSelect()
printFloatArray()
