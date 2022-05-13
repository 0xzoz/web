import detectEthereumProvider from '@metamask/detect-provider'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { RouteComponentProps } from 'react-router-dom'
import { ActionTypes, WalletActions } from 'context/WalletProvider/actions'
import { KeyManager } from 'context/WalletProvider/KeyManager'
import { setLocalWalletTypeAndDeviceId } from 'context/WalletProvider/local-wallet'
import { useWallet } from 'hooks/useWallet/useWallet'

import { ConnectModal } from '../../components/ConnectModal'
import { RedirectModal } from '../../components/RedirectModal'
import { LocationState } from '../../NativeWallet/types'
import { TallyConfig } from '../config'

export interface TallySetupProps
  extends RouteComponentProps<
    {},
    any, // history
    LocationState
  > {
  dispatch: React.Dispatch<ActionTypes>
}

export const TallyConnect = ({ history }: TallySetupProps) => {
  const { dispatch, state } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<any>()

  // eslint-disable-next-line no-sequences
  const setErrorLoading = (e: string | null) => (setError(e), setLoading(false))

  useEffect(() => {
    ;(async () => {
      try {
        setProvider(await detectEthereumProvider())
      } catch (e) {
        if (!isMobile) console.error(e)
      }
    })()
  }, [setProvider])

  const pairDevice = async () => {
    setError(null)
    setLoading(true)

    if (!provider) {
      throw new Error('walletProvider.tally.errors.connectFailure')
    }

    if (state.adapters && state.adapters?.has(KeyManager.Tally)) {
      const wallet = await state.adapters.get(KeyManager.Tally)?.pairDevice()
      if (!wallet) {
        setErrorLoading('walletProvider.errors.walletNotFound')
        throw new Error('Call to hdwallet-tally::pairDevice returned null or undefined')
      }

      const { name, icon } = TallyConfig
      try {
        const deviceId = await wallet.getDeviceID()

        if (provider !== window.ethereum) {
          throw new Error('walletProvider.tally.errors.multipleWallets')
        }

        if (provider?.chainId !== '0x1') {
          throw new Error('walletProvider.tally.errors.network')
        }

        // Hack to handle Tally account changes
        //TODO: handle this properly
        const resetState = () => dispatch({ type: WalletActions.RESET_STATE })
        provider?.on?.('accountsChanged', resetState)
        provider?.on?.('chainChanged', resetState)

        const oldDisconnect = wallet.disconnect.bind(wallet)
        wallet.disconnect = () => {
          provider?.removeListener?.('accountsChanged', resetState)
          provider?.removeListener?.('chainChanged', resetState)
          return oldDisconnect()
        }

        await wallet.initialize()

        dispatch({
          type: WalletActions.SET_WALLET,
          payload: { wallet, name, icon, deviceId }
        })
        dispatch({ type: WalletActions.SET_IS_CONNECTED, payload: true })
        setLocalWalletTypeAndDeviceId(KeyManager.Tally, deviceId)
        history.push('/tally/success')
      } catch (e: any) {
        if (e?.message?.startsWith('walletProvider.')) {
          console.error('Tally Connect: There was an error initializing the wallet', e)
          setErrorLoading(e?.message)
        } else {
          setErrorLoading('walletProvider.tally.errors.unknown')
          history.push('/tally/failure')
        }
      }
    }
    setLoading(false)
  }

  // This constructs the Tally deep-linking target from the currently-loaded
  // window.location. The port will be blank if not specified, in which case it
  // should be omitted.
  const mmDeeplinkTarget = [window.location.hostname, window.location.port]
    .filter(x => !!x)
    .join(':')

  // The MM mobile app itself injects a provider, so we'll use pairDevice once
  // we've reopened ourselves in that environment.
  console.log('provider')
  console.log(provider)
  console.log('isMobile')
  console.log(isMobile)
  return !provider && isMobile ? (
    <RedirectModal
      headerText={'walletProvider.tally.redirect.header'}
      bodyText={'walletProvider.tally.redirect.body'}
      buttonText={'walletProvider.tally.redirect.button'}
      onClickAction={(): any => {
        console.log('redirect')
        console.log(mmDeeplinkTarget)
      
        window.location.assign(`https://tally.app.link/dapp/${mmDeeplinkTarget}`)
      }}
      loading={loading}
      error={error}
    ></RedirectModal>
  ) : (
    <ConnectModal
      headerText={'walletProvider.tally.connect.header'}
      bodyText={'walletProvider.tally.connect.body'}
      buttonText={'walletProvider.tally.connect.button'}
      pairDevice={pairDevice}
      loading={loading}
      error={error}
    ></ConnectModal>
  )
}
