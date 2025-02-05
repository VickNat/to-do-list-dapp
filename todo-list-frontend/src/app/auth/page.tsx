'use client'

import React, { useState } from 'react';
import detectEthereumProvider from "@metamask/detect-provider";
import {
  Eip1193Provider,
  createKeyStoreInteractor,
  createSingleSigAuthDescriptorRegistration,
  createWeb3ProviderEvmKeyStore,
  hours,
  registerAccount,
  registrationStrategy,
  ttlLoginRule,
  deleteAuthDescriptor,
} from "@chromia/ft4";
import { createClient } from "postchain-client";
import { useSessionContext } from '@/components/ContextProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AuthPage = () => {
  const [name, setName] = useState("");
  const router = useRouter();
  const { setSession } = useSessionContext();

  const handleLogin = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }

    const provider = (await detectEthereumProvider()) as unknown as Eip1193Provider;

    if (!provider) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }

    const accounts = await provider.request({ method: "eth_requestAccounts" });

    const client = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: 'B9D9F5DF8B7ECAE9595D56F18DC5AA7958325BE483751117DB7CCFD2EEDFD389',
    });

    const evmKeyStore = await createWeb3ProviderEvmKeyStore(provider);
    const evmKeyStoreInteractor = createKeyStoreInteractor(client, evmKeyStore);
    const chromiaAccounts = await evmKeyStoreInteractor.getAccounts();

    if (chromiaAccounts.length > 0) {
      const { session } = await evmKeyStoreInteractor.login({
        accountId: chromiaAccounts[0].id,
        config: {
          rules: ttlLoginRule(hours(2)),
          flags: ["MySession"],
        },
      });
      setSession(session);
      router.push('/');
    } else {
      const authDescriptor = createSingleSigAuthDescriptorRegistration(["A", "T"], evmKeyStore.id);

      try {
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
            args: [name],
          }
        );
        setSession(session);
        router.push('/');
      } catch (error: any) {
        if (error.message.includes("Max <10> auth descriptor count reached")) {
          // Logic to delete existing auth descriptors before adding a new one
          for (let i = 0; i < chromiaAccounts.length; i++) {
            await deleteAuthDescriptor(chromiaAccounts[i].id);
          }
          
          // Retry account registration
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
              args: [name],
            }
          );
          setSession(session);
          router.push('/');
        } else {
          console.error("Error during registration:", error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c28] text-[#f5f5f5] flex flex-col items-center justify-center p-5">
      <Card className="w-full max-w-md p-6 bg-[#28293e] border border-gray-700 rounded-lg shadow-lg">
        <CardContent>
          <h1 className="text-3xl font-bold mb-6 text-[#007bff] text-center">Login</h1>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="bg-[#3b3c4a] border-0 text-white mb-4"
          />
          <Button onClick={handleLogin} className="w-full bg-[#007bff] hover:bg-[#0056b3]">
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
