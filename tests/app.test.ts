import { AppsProvider } from '../src/apps';
import { NETWORK } from '../src/types';

describe('apps.ts', () => {
    let appsProviderDevnet: AppsProvider;
    let appsProviderMainnet: AppsProvider;
    beforeAll(async () => {
        //TODO: put here info
        appsProviderDevnet = new AppsProvider(NETWORK.Devnet);
        appsProviderMainnet = new AppsProvider(NETWORK.MainnetBeta);
    })

    afterAll(async () => {

    })

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

    describe('getAppConfig', () => {
        const credixId = 'CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX';
        it('should get credix for devnet', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixId);
            expect(config).toBeDefined();
            expect(config?.ui.length).toBeGreaterThan(0);
        })

        it('should get credix for mainnet', async () => {
            const config = await appsProviderMainnet.getAppConfig(credixId);
            expect(config).toBeDefined();
            expect(config?.ui.length).toBeGreaterThan(0);
        })

        it('should get credix for depositTranche [mainnet]', async () => {
            const config = await appsProviderMainnet.getAppConfig(credixId);
            const depositTranche = config?.ui.find(x => x.name === 'depositTranche');
            expect(config).toBeDefined();
            expect(depositTranche).toBeDefined();
        })
        
        it('should get credix for depositTranche [devnet]', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixId);
            const depositTranche = config?.ui.find(x => x.name === 'depositTranche');
            expect(config).toBeDefined();
            expect(depositTranche).toBeDefined();
        })

        it('should get credix for withdrawTranche [devnet]', async () => {
            const config = await appsProviderDevnet.getAppConfig(credixId);
            const withdrawTranche = config?.ui.find(x => x.name === 'withdrawTranche');
            expect(config).toBeDefined();
            expect(withdrawTranche).toBeDefined();
        })
    })
});