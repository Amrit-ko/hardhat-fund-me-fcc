const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("fundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const value = ethers.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer,
              )
          })
          describe("constructor", function () {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund function", function () {
              it("Not allows to send less money", async function () {
                  await expect(fundMe.fund()).to.be.reverted
                  // await fundMe.fund({ value: "100" })
              })

              it("upgrading getFunders array", async function () {
                  await fundMe.fund({ value })
                  const result = await fundMe.getFunders(0)
                  assert.equal(result, deployer)
              })

              it("uprading maping  getAddressToAmountFunded ", async function () {
                  await fundMe.fund({ value })
                  const result = await fundMe.getAddressToAmountFunded(deployer)
                  assert.equal(result.toString(), value.toString())
              })
          })

          describe("Withdraw function", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value })
              })

              it("Withdarw ETH from contract to address with single founder", async function () {
                  const deployerBalanceBefore =
                      await ethers.provider.getBalance(deployer)
                  const contractBalanceBefore =
                      await ethers.provider.getBalance(fundMe.target)

                  const transaction = await fundMe.withdraw()
                  const tx = await transaction.wait(1)
                  const { gasPrice, gasUsed } = tx
                  const gasCost = gasPrice * gasUsed

                  const deployerBalanceAfter = await ethers.provider.getBalance(
                      deployer,
                  )
                  const contractBalanceAfter = await ethers.provider.getBalance(
                      fundMe.target,
                  )

                  assert.equal(contractBalanceAfter, 0)
                  assert.equal(
                      (deployerBalanceAfter + gasCost).toString(),
                      (
                          deployerBalanceBefore + contractBalanceBefore
                      ).toString(),
                  )
              })

              it("Withdarw ETH from contract to address with multiple founder", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await connectedContract.fund({ value })
                  }

                  const deployerBalanceBefore =
                      await ethers.provider.getBalance(deployer)
                  const contractBalanceBefore =
                      await ethers.provider.getBalance(fundMe.target)

                  const transaction = await fundMe.withdraw()
                  const tx = await transaction.wait(1)
                  const { gasPrice, gasUsed } = tx
                  const gasCost = gasPrice * gasUsed

                  const deployerBalanceAfter = await ethers.provider.getBalance(
                      deployer,
                  )
                  const contractBalanceAfter = await ethers.provider.getBalance(
                      fundMe.target,
                  )

                  assert.equal(contractBalanceAfter, 0)
                  assert.equal(
                      (deployerBalanceAfter + gasCost).toString(),
                      (
                          deployerBalanceBefore + contractBalanceBefore
                      ).toString(),
                  )

                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Cheap withdraw ETH from contract to address with multiple founder", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await connectedContract.fund({ value })
                  }

                  const deployerBalanceBefore =
                      await ethers.provider.getBalance(deployer)
                  const contractBalanceBefore =
                      await ethers.provider.getBalance(fundMe.target)

                  const transaction = await fundMe.cheapWithdraw()
                  const tx = await transaction.wait(1)
                  const { gasPrice, gasUsed } = tx
                  const gasCost = gasPrice * gasUsed

                  const deployerBalanceAfter = await ethers.provider.getBalance(
                      deployer,
                  )
                  const contractBalanceAfter = await ethers.provider.getBalance(
                      fundMe.target,
                  )

                  assert.equal(contractBalanceAfter, 0)
                  assert.equal(
                      (deployerBalanceAfter + gasCost).toString(),
                      (
                          deployerBalanceBefore + contractBalanceBefore
                      ).toString(),
                  )

                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
              it("not allows to withdraw by not owner", async function () {
                  const accounts = await ethers.getSigners()
                  const connectedContract = await fundMe.connect(accounts[1])
                  await expect(connectedContract.withdraw()).to.be.reverted
              })
          })
      })
