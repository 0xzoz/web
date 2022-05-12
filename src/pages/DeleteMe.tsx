import { Container, Stack } from '@chakra-ui/react'
import { useController, useForm } from 'react-hook-form'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { AllocationTable } from 'components/DeFi/Deposit/components/AllocationTable'
import { AssetInput } from 'components/DeFi/Deposit/components/AssetInput'
import { FormField } from 'components/DeFi/Deposit/components/FormField'
import { StepRow } from 'components/DeFi/Deposit/components/StepRow'
import { Row } from 'components/Row/Row'
import { RawText } from 'components/Text'
import { TransactionLink } from 'components/TransactionHistoryRows/TransactionLink'
import { bnOrZero } from 'lib/bignumber/bignumber'

const testData = [
  {
    symbol: 'FOX',
    value: '1000',
    icon: 'https://assets.coincap.io/assets/icons/256/fox.png',
  },
  {
    symbol: 'USDC',
    value: '1000',
    icon: 'https://assets.coincap.io/assets/icons/256/usdc.png',
  },
]

export const DeleteMe = () => {
  const translate = useTranslate()
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ mode: 'onChange' })

  const onSubmit = (data: any) => {
    alert(JSON.stringify(data))
  }
  const balance = '1000'
  const price = '0.23'

  const validateCryptoAmount = (value: string) => {
    const crypto = bnOrZero(balance).div(`1e+${18}`)
    const _value = bnOrZero(value)
    const hasValidBalance = crypto.gt(0) && _value.gt(0) && crypto.gte(value)
    if (_value.isEqualTo(0)) return ''
    return hasValidBalance || translate('common.insufficientFunds')
  }

  const { field: cryptoAmount } = useController({
    name: 'cryptoAmount',
    control,
    rules: { required: true, validate: { validateCryptoAmount } },
  })
  const { field: fiatAmount } = useController({ name: 'fiatAmount', control })
  const { field: rewardAmount } = useController({ name: 'rewardAmount', control })

  const handleOnChange = (value: string, isFiat?: boolean) => {
    if (isFiat) {
      fiatAmount.onChange(value)
      cryptoAmount.onChange(bnOrZero(value).div(price).toFixed(4).toString())
      rewardAmount.onChange(bnOrZero(value).div(price).toFixed(4).toString())
    } else {
      cryptoAmount.onChange(value)
      fiatAmount.onChange(bnOrZero(value).times(price).toFixed(4).toString())
      rewardAmount.onChange(value)
    }
  }
  const handleMax = (value: number) => {
    const amount = bnOrZero(balance).times(value)
    fiatAmount.onChange(amount.times(price).toString())
    cryptoAmount.onChange(amount.toString())
    rewardAmount.onChange(amount.toString())
  }

  return (
    <Container mt={6} p={8} maxWidth='500px'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={6}>
          <FormField label='Amount To Deposit'>
            <AssetInput
              cryptoAmount={cryptoAmount?.value}
              errors={errors.cryptoAmount}
              fiatAmount={fiatAmount?.value}
              balance='1000'
              onChange={(value, isFiat) => handleOnChange(value, isFiat)}
              assetName='FOX'
              onMaxClick={value => handleMax(value)}
              assetIcon='https://assets.coincap.io/assets/icons/256/fox.png'
            />
          </FormField>

          <FormField label='Recieve'>
            <AssetInput
              cryptoAmount={cryptoAmount?.value}
              isReadOnly
              assetName='USDC'
              assetIcon='https://assets.coincap.io/assets/icons/256/usdc.png'
            >
              <AllocationTable
                label='Est. Pool Allocation'
                items={testData}
                rightElement={<Amount.Percent value={0.2} />}
              />
            </AssetInput>
          </FormField>
        </Stack>
      </form>
      <Stack spacing={4} mt={8}>
        <StepRow
          label='FOX Approval'
          stepNumber='1'
          isComplete
          buttonLabel='Approve'
          buttonOnClick={() => console.info('approve')}
          rightElement={<TransactionLink txid={'1234'} explorerTxLink={'https://google.com'} />}
        >
          <RawText>Allow ShapeShift DAO to use your FOX.</RawText>
          <Row>
            <Row.Label>Allowance to Approve</Row.Label>
            <Row.Value>Exact</Row.Value>
          </Row>
          <Row>
            <Row.Label>Estimated Gas Fee</Row.Label>
            <Row.Value display='flex'>
              <Amount.Fiat value='20.00' mr={2} />
              <Amount.Crypto color='gray.500' value='0.024' symbol='ETH' />
            </Row.Value>
          </Row>
        </StepRow>
        <StepRow
          label='Confirm'
          stepNumber='2'
          isActive
          buttonLabel='Confirm'
          buttonOnClick={() => console.info('confirm')}
        >
          <Row alignItems='center'>
            <Row.Label>Deposit To</Row.Label>
            <Row.Value>
              <TransactionLink txid={'1234'} explorerTxLink={'https://google.com'} />
            </Row.Value>
          </Row>
          <Row>
            <Row.Label>Estimated Gas Fee</Row.Label>
            <Row.Value display='flex'>
              <Amount.Fiat value='20.00' mr={2} />
              <Amount.Crypto color='gray.500' value='0.024' symbol='ETH' />
            </Row.Value>
          </Row>
        </StepRow>
      </Stack>
    </Container>
  )
}
