const { ethers, network, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows to fund ", async function () {
              const transaction = await fundMe.fund({ value: sendValue })
              await transaction.wait(1)
              const contractBalance = await ethers.provider.getBalance(
                  fundMe.target,
              )
              assert.equal(contractBalance.toString(), sendValue.toString())
          })
          it("allows to withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              const transaction = await fundMe.withdraw()
              await transaction.wait(1)
              const contractBalance = await ethers.provider.getBalance(
                  fundMe.target,
              )
              assert.equal(contractBalance.toString(), "0")
          })
      })
