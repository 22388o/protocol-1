import { useMemo } from 'react';
import { useWeb3React } from '@web3-react/core';

const supportedCompNetworks = [1, 3, 4, 5, 42, 1337, 5777, 31337];

function useIsValidNetwork() {
  const { chainId } = useWeb3React();

  const isValidCompNetwork = useMemo(() => {
    return supportedCompNetworks.includes(chainId);
  }, [chainId]);

  return {
    isValidNetwork: isValidCompNetwork,
  };
}

export default useIsValidNetwork;