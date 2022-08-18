import { EncryptedDatabase } from 'libeds'
import { providers as EthersProviders } from 'ethers'

export const EDS = new EncryptedDatabase()
export function initializeEDS () {
	return EDS.initialize(new EthersProviders.Web3Provider(window.ethereum, 'any'), {
		appID: 'PipedMaterial',
		url: process.env.VUE_APP_EDS_URL ?? 'wss://eds.gra.১.net:18001'
	})
}

window.EDS = EDS
