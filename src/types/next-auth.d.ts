import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */

    export interface User  {
        pkh?: string,
        swAdmin?: boolean; 
        swCreate?: boolean;
        walletName?: string;
        swEnviarPorBlockfrost?: boolean;
        isWalletFromSeedletName?: boolean;
    }

    export interface JWT  {
        pkh?: string,
        swAdmin?: boolean; 
        swCreate?: boolean;
        walletName?: string;
        swEnviarPorBlockfrost?: boolean;
        isWalletFromSeedletName?: boolean;
    }

    export interface Session {
        user: {
            pkh?: string,
            swAdmin?: boolean; 
            swCreate?: boolean;
            walletName?: string;
            swEnviarPorBlockfrost?: boolean;
            isWalletFromSeedletName?: boolean;
        }
    }
    //     //     user: {
    //     //       pkh?: string,
    //     //       swAdmin?: boolean; 
    //     //       swCreate?: boolean;
    //     //     } & DefaultSession["user"]
    //     //   }
    // }
}