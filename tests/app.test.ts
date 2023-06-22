import { AppsProvider } from '../src/apps';
import { NETWORK } from '../src/types';

describe('apps.ts', () => {
    let appsProviderDevnet: AppsProvider;
    let appsProviderMainnet: AppsProvider;
    beforeAll(async () => {
        //Create providers for different networks
        appsProviderDevnet = new AppsProvider(NETWORK.Devnet);
        appsProviderMainnet = new AppsProvider(NETWORK.MainnetBeta);
    })

    afterAll(async () => {

    });

    describe('dummy test', () => {console.log("========= This is a dummy test ========");
    });

    describe('getApps', () => {
        it('should get list for devnet', async () => {
            const list = await appsProviderDevnet.getApps();

            expect(list).toBeDefined();
            expect(list.length).toBeGreaterThan(0);
        })

        it('should get list for mainnet', async () => {
            const list = await appsProviderMainnet.getApps();

            expect(list).toBeDefined();
            expect(list.length).toBeGreaterThan(0);
        })
    })

    describe('getAppConfig CREDIX', () => {
        const credixIdMainnet = 'CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX';
        const credixIdDevnet = 'crdszSnZQu7j36KfsMJ4VEmMUTJgrNYXwoPVHUANpAu';
        it('should get credix for devnet', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixIdDevnet);
            expect(config).toBeDefined();
            expect(config?.ui.length).toBeGreaterThan(0);
        })

        it('should get Credix for mainnet', async () => {
            const config = await appsProviderMainnet.getAppConfig(credixIdMainnet);
            expect(config).toBeDefined();
            expect(config?.ui.length).toBeGreaterThan(0);
        })

        it('should get Credix depositTranche [mainnet]', async () => {
            const config = await appsProviderMainnet.getAppConfig(credixIdMainnet);
            const depositTranche = config?.ui.find(x => x.name === 'depositTranche');
            expect(config).toBeDefined();
            expect(depositTranche).toBeDefined();
        })
        
        it('should get Credix depositTranche [devnet]', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixIdDevnet);
            const depositTranche = config?.ui.find(x => x.name === 'depositTranche');
            expect(config).toBeDefined();
            expect(depositTranche).toBeDefined();
        })

        it('should get Credix withdrawTranche [devnet]', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixIdDevnet);
            const withdrawTranche = config?.ui.find(x => x.name === 'withdrawTranche');
            expect(config).toBeDefined();
            expect(withdrawTranche).toBeDefined();
        })
    });
});