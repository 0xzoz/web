import { FailureModal } from 'context/WalletProvider/components/FailureModal'

export const TallyFailure = () => {
  return (
    <FailureModal
      headerText={'walletProvider.tally.failure.header'}
      bodyText={'walletProvider.tally.failure.body'}
    ></FailureModal>
  )
}
