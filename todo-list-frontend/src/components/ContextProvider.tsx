"use client";

import {
  Eip1193Provider,
  Session,
  createKeyStoreInteractor,
  createSingleSigAuthDescriptorRegistration,
  createWeb3ProviderEvmKeyStore,
  hours,
  registerAccount,
  registrationStrategy,
  ttlLoginRule,
} from "@chromia/ft4";
import { createClient } from "postchain-client";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { getRandomUserName } from "../app/user";

// Define hooks for accessing context
export function useSessionContext() {
  return useContext(ChromiaContext);
}

// Create context for Chromia session
const ChromiaContext = createContext<Session | undefined>(undefined);

// 2.
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function ContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    const initSession = async () => {
      console.log("Initializing Session");

      if (!window.ethereum) {
        console.error("MetaMask not detected. Please install MetaMask1.");
        return;
      }
      // 1. Detect MetaMask provider
      const provider = (await detectEthereumProvider()) as unknown as Eip1193Provider;

      if (!provider) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
      }

      // 2. Request MetaMask account access
      try {
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        console.log("Connected Account:", accounts[0]); // Log connected wallet address
      } catch (error) {
        console.error("User denied MetaMask access");
        return;
      }

      // 3. Initialize Chromia Client
      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: 'B9D9F5DF8B7ECAE9595D56F18DC5AA7958325BE483751117DB7CCFD2EEDFD389',
      });

      console.log("Chromia Client initialized with:", client);

      // 4. Connect with MetaMask using Chromia's EVM keystore
      const evmKeyStore = await createWeb3ProviderEvmKeyStore(provider);

      // 5. Get all accounts associated with the EVM address
      const evmKeyStoreInteractor = createKeyStoreInteractor(client, evmKeyStore);
      const accounts = await evmKeyStoreInteractor.getAccounts();

      console.log("Retrieved accounts from Chromia:", accounts);

      if (accounts.length > 0) {
        console.log("===> Account Found", accounts[0]);

        // 6. Start a new session
        const { session } = await evmKeyStoreInteractor.login({
          accountId: accounts[0].id,
          config: {
            rules: ttlLoginRule(hours(2)),
            flags: ["MySession"],
          },
        });
        setSession(session);
      } else {
        console.log("===> Creating New Account");

        // 7. Create a new account by signing a message using MetaMask
        const authDescriptor = createSingleSigAuthDescriptorRegistration(["A", "T"], evmKeyStore.id);
        console.log("Auth Descriptor:", authDescriptor);
        const { session } = await registerAccount(
          client,
          evmKeyStore,
          registrationStrategy.open(authDescriptor, {
            config: {
              rules: ttlLoginRule(hours(2)),
              flags: ["MySession"],
            },
          }),
          {
            name: "register_user",
            args: [getRandomUserName()],
          }
        );
        console.log("New account registered, session:", session);
        setSession(session);
      }

      console.log("Session initialized");
    };

    initSession().catch(console.error);
  }, []);

  return <ChromiaContext.Provider value={session}>{children}</ChromiaContext.Provider>;
}
