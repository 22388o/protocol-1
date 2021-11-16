import { useContract } from "./useContract";
import NFTData from "../../v1-core/artifacts/contracts/NFT.sol/NFT.json";
import { useWeb3React } from "@web3-react/core";
import useIsValidNetwork from "./useIsValidNetwork";
import { useAppContext } from "../AppContext";

export const useNFT = () => {
    const { account } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const nftContractAddressPUNK = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
    const nftContractAddressBAYC = "0xc5a5C42992dECbae36851359345FE25997F5C42d";
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
        for (var tokenId = 0; tokenId < 6; tokenId++) { // NOTE: Only 6 minted as per scripts/deploy.js 
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
        for (var tokenId = 0; tokenId < 6; tokenId++) { // NOTE: Only 6 minted as per scripts/deploy.js 
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

    const fetchImagesBorrow = async () => {
        console.log('fetchImagesBorrow borrowProject', borrowProject);
        const imageDict = {}
        if (borrowProject == "PUNK") {
            imageDict = imageDictPUNK;
        } 
        else if (borrowProject == "BAYC") {
            imageDict = imageDictBAYC;
        }
        setImageDictBorrow(imageDict);
    }

    return {
        fetchImagesPUNK,
        fetchImagesBAYC,
        fetchImagesBorrow,
        imageDictPUNK,
        imageDictBAYC,
        nftAddressSymbolDict,
        nftContract,
        fetchImageBAYC,
        fetchImagePUNK
    }
};

export default useNFT;