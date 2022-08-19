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
});