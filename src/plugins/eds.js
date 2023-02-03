import { EncryptedDatabase } from 'libeds'
import * as ethers from 'ethers'
import crypto from 'crypto'

import * as sigUtil from '@metamask/eth-sig-util'

export const EDS = new EncryptedDatabase()

class WalletWrapper {
	wallet = null
	privateKey = null

	constructor (privateKey) {
		this.privateKey = privateKey
		this.wallet = new ethers.Wallet(privateKey)
	}

	getSigner () {
		return this.wallet
	}

	async send (method, params) {
		switch (method) {
			case 'eth_getEncryptionPublicKey': {
				return sigUtil.getEncryptionPublicKey(this.privateKey.toString('hex'))
			}
			case 'eth_decrypt': {
				const data = Buffer.from(params[0].slice(2), 'hex').toString()
				const buf = sigUtil.decrypt({
					encryptedData: JSON.parse(data),
					privateKey: this.privateKey.toString('hex')
				})
				return buf
			}
		}
	}
}

export async function initializeEDS ({ username, password, privateKey }) {
	let wallet
	if (privateKey) {
		wallet = new WalletWrapper(Buffer.from(privateKey, 'base64'))
	} else {
		const privKey = crypto.pbkdf2Sync(password, crypto.createHash('sha512').update(username).digest(), 5000, 32, 'sha512')
		window.localStorage.setItem('EDS_PRIVATE_KEY', privKey.toString('base64'))
		wallet = new WalletWrapper(privKey)
	}

	window.EDSWallet = wallet
	return EDS.initialize(wallet, {
		appID: 'PipedMaterial',
		url: process.env.VUE_APP_EDS_URL ?? 'wss://eds.gra.১.net:18001'
	})
}

window.EDS = EDS
