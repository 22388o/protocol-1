import requests
import json

url = "https://gateway.pinata.cloud/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/"
res = {}

for tokenId in range(0,100):
    try:
        scrapeUrl = f'{url}/{tokenId}'
        r = requests.get(scrapeUrl)
        res[tokenId] = r.json()
    except: 
        print('failed', tokenId)
        
with open('./metaBAYC.json', 'w') as f:
    json.dump(res, f)