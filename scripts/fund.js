const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const transaction = await fundMe.fund({ value: ethers.parseEther("0.1") })
    await transaction.wait(1)
    console.log("Funded")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
