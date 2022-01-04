import { useEffect, useState } from 'react'
import { useWallet } from 'use-wallet'
import Web3 from 'web3'
import erc20 from '../data/erc20-abi.json'
import erc721 from '../data/erc721-abi.json'
import dispenserAbi from '../data/chiz-dispenser-v3-abi.json'

export default function useContracts() {
    const wallet = useWallet()
    const web3 = new Web3(wallet.account ? wallet.ethereum : process.env.NEXT_PUBLIC_WEBSOCKET_URL_ETH)

    const chizContract = new web3.eth.Contract(erc20 as any, `${process.env.NEXT_PUBLIC_ERC20_CONTRACT_ADDRESS_ETH}`)

    const ratContract = new web3.eth.Contract(erc721 as any, `${process.env.NEXT_PUBLIC_ERC721_CONTRACT_ADDRESS_ETH}`)

    const cheddazContract = new web3.eth.Contract(erc721 as any, `${process.env.NEXT_PUBLIC_CHEDDAZ_CONTRACT_ETH}`)

    const dispenserContract = new web3.eth.Contract(dispenserAbi as any, `${process.env.NEXT_PUBLIC_CHIZ_DISPENSER_V3_ADDRESS_ETH}`)

    const [chizBalance, setChizBalance] = useState(0)
    const [ratBalance, setRatBalance] = useState(0)
    const [cheddazBalance, setCheddazBalance] = useState(0)
    const [rewardPerRat, setRewardPerRat] = useState(0)
    const [dispenserAmountClaimed, setDispenserAmountClaimed] = useState(0)

    useEffect(() => {
        const loadData = async () => {
            if (!wallet.account) return

            const chizBalanceFromWeb3 = await chizContract.methods.balanceOf(wallet.account).call({ xfrom: wallet.account })
            setChizBalance(web3.utils.fromWei(chizBalanceFromWeb3))

            const ratBalanceFromWeb3 = await ratContract.methods.balanceOf(wallet.account).call()
            setRatBalance(ratBalanceFromWeb3)

            const cheddazBalanceFromWeb3 = await cheddazContract.methods.balanceOf(wallet.account).call()
            setCheddazBalance(cheddazBalanceFromWeb3)

            const rewardPerRatFromWeb3 = await dispenserContract.methods.amount().call()
            setRewardPerRat(web3.utils.fromWei(rewardPerRatFromWeb3))
        }

        loadData()
    }, [wallet])

    useEffect(() => {
        const load = async () => {
            if (!wallet.account) return
            if (!ratBalance) return
            setDispenserAmountClaimed(0)
            for (let i = 0; i < ratBalance; i++) {
                const tokenId = await ratContract.methods.tokenOfOwnerByIndex(wallet.account, i).call()
                const claimedAmountInWei = await dispenserContract.methods.existingClaims(tokenId).call()

                const claimedAmount = Number(web3.utils.fromWei(claimedAmountInWei))
                setDispenserAmountClaimed((_) => (_ += claimedAmount))
            }
        }
        load()
    }, [wallet, ratBalance])

    return {
        chizBalance,
        ratBalance,
        cheddazBalance,
        chizContract,
        ratContract,
        cheddazContract,
        dispenserContract,
        rewardPerRat,
        dispenserAmountClaimed
    }
}
