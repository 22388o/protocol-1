import { useContract } from "./useContract";
import { useWeb3React } from "@web3-react/core";
import useIsValidNetwork from "./useIsValidNetwork";
import { useAppContext } from "../AppContext";
import NFTData from "../artifacts/contracts/mocks/NFT/NFT.json";

export const useNFT = () => {
    const { account } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const nftContractAddressPUNK = process.env.REACT_APP_NFT_PUNK_CONTRACT_ADDRESS;
    const nftContractAddressBAYC = process.env.REACT_APP_NFT_BAYC_CONTRACT_ADDRESS;
    const nftContractABI = NFTData["abi"];
    const nftContractPUNK = useContract(nftContractAddressPUNK, nftContractABI);
    const nftContractBAYC = useContract(nftContractAddressBAYC, nftContractABI);
    const nftContract = {
        "PUNK": nftContractPUNK,
        "BAYC": nftContractBAYC
    }
    const { setImageDictPUNK, setImageDictBAYC, setImageDictBorrow, imageDictPUNK, imageDictBAYC,
        borrowProject } = useAppContext();

    const nftAddressSymbolDict = {}
    nftAddressSymbolDict[nftContractAddressPUNK] = "PUNK";
    nftAddressSymbolDict[nftContractAddressBAYC] = "BAYC";

    const fetchImagesPUNK = async () => {
        const imageDict = {};
        for (var tokenId = 0; tokenId < 10; tokenId++) { // NOTE: Only 6 minted as per scripts/deploy.js 
            const owner = await nftContract["PUNK"].ownerOf(tokenId);
            if (owner==account) {
                let paddedTokenId = tokenId.toString().padStart(4, '0');
                let imageURL = `https://larvalabs.com/public/images/cryptopunks/punk${paddedTokenId}.png`; 
                imageDict[tokenId] = imageURL;
            }
        }
        setImageDictPUNK(imageDict);
    }

    const fetchImagesBAYC = async () => {
        const imageDict = {};
        for (var tokenId = 0; tokenId < 10; tokenId++) { // NOTE: Only 6 minted as per scripts/deploy.js 
            const owner = await nftContract["BAYC"].ownerOf(tokenId);
            if (owner==account) {
                let response = await fetch(`https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/${tokenId}`);
                let data = await response.json();
                let imageIPFS = data["image"];
                let imageURL = `https://ipfs.io/ipfs/${imageIPFS.split("//")[1]}`;
                imageDict[tokenId] = imageURL;
            }
        }
        setImageDictBAYC(imageDict);
    }

    const fetchImagePUNK = async (tokenId) => {
        let paddedTokenId = tokenId.toString().padStart(4, '0');
        let imageURL = `https://larvalabs.com/public/images/cryptopunks/punk${paddedTokenId}.png`; 
        return imageURL;
    }

    const fetchImageBAYC = async (tokenId) => {
        let response = await fetch(`https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/${tokenId}`);
        let data = await response.json();
        let imageIPFS = data["image"];
        let imageURL = `https://ipfs.io/ipfs/${imageIPFS.split("//")[1]}`;
        return imageURL
    }

    const setImagesBorrow = async (nftSymbol) => {
        if (nftSymbol == "PUNK") {
            setImageDictBorrow(imageDictPUNK);
        } 
        else if (nftSymbol == "BAYC") {
            setImageDictBorrow(imageDictBAYC);
        }
        
    }

    return {
        fetchImagesPUNK,
        fetchImagesBAYC,
        setImagesBorrow,
        imageDictPUNK,
        imageDictBAYC,
        nftAddressSymbolDict,
        nftContract,
        fetchImageBAYC,
        fetchImagePUNK
    }
};

export default useNFT;