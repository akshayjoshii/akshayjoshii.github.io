import os 

def rename(path): 
	for count, filename in enumerate(os.listdir(path)):
		if filename == "rename.py":
			pass
		else:
			dst = str(count) + ".jpg"
			src = filename 
			os.rename(src, dst) 
  
# Driver Code 
if __name__ == '__main__': 
	path = r"C:\Hugo\akshay\themes\academia-hugo\exampleSite\content\home\gallery\gallery"
	rename(path)