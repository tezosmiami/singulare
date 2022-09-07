import smartpy as sp


class HarbergerFee(sp.Contract):
    """This contract calculates and distributes the Harberger fees associated
    to a specific token contract.

    """

    TOKEN_FEE_TYPE = sp.TRecord(
        # The price set by the token owner
        price=sp.TMutez,
        # The Harberger fee in per mile
        fee=sp.TNat,
        # The Harberger fee recipient
        recipient=sp.TAddress,
        # The deadline for the next fee payment
        next_payment=sp.TTimestamp,
        # Flag that indicates if the token is currently on a Dutch auction
        auction=sp.TBool).layout(
            ("price", ("fee", ("recipient", ("next_payment", "auction")))))

    # Fees are paid every 30 days
    FEE_PERIOD_IN_SECONDS = 3600 * 24 * 30

    def __init__(self, administrator, metadata, token_contract):
        """Initializes the contract.

        """
        # Define the contract storage data types for clarity
        self.init_type(sp.TRecord(
            # The contract administrator
            administrator=sp.TAddress,
            # The contract metadata
            metadata=sp.TBigMap(sp.TString, sp.TBytes),
            # The token contract
            token_contract=sp.TAddress,
            # The big map with the token owners deposits to pay the fees
            deposits=sp.TBigMap(sp.TAddress, sp.TMutez),
            # The big map with the tokens fee information
            fees=sp.TBigMap(sp.TNat, HarbergerFee.TOKEN_FEE_TYPE),
            # The big map with the tokens fee payment approvals
            approved_tokens=sp.TBigMap(
                sp.TPair(sp.TAddress, sp.TNat), sp.TUnit),
            # The proposed new administrator address
            proposed_administrator=sp.TOption(sp.TAddress)))

        # Initialize the contract storage
        self.init(
            administrator=administrator,
            metadata=metadata,
            token_contract=token_contract,
            deposits=sp.big_map(),
            fees=sp.big_map(),
            approved_tokens=sp.big_map(),
            proposed_administrator=sp.none)

    def check_no_tez_transfer(self):
        """Checks that no tez were transferred in the operation.

        """
        sp.verify(sp.amount == sp.mutez(0), message="HFEE_TEZ_TRANSFER")

    def get_deposit(self, user):
        """Gets the amount of mutez in the user deposit.

        """
        return self.data.deposits.get(user, sp.mutez(0))

    def check_is_administrator(self):
        """Checks that the address that called the entry point is the contract
        administrator.

        """
        sp.verify(sp.sender == self.data.administrator,
                  message="HFEE_NOT_ADMIN")

    def check_is_token_contract(self):
        """Checks that the address that called the entry point is the token
        contract.

        """
        sp.verify(sp.sender == self.data.token_contract,
                  message="HFEE_NOT_TOKEN_CONTRACT")

    def check_token_exists(self, token_id):
        """Checks that the given token exists.

        """
        sp.verify(self.data.fees.contains(token_id),
                  message="HFEE_TOKEN_UNDEFINED")

    def check_token_is_approved(self, user, token_id):
        """Checks that the user approved to pay the token fees.

        """
        sp.verify(self.data.approved_tokens.contains((user, token_id)),
                  message="HFEE_TOKEN_NOT_APPROVED")

    def get_token_owner(self, token_id):
        """Gets the token owner from the token contract on-chain view.

        """
        return sp.view(
            name="token_owner",
            address=self.data.token_contract,
            param=token_id,
            t=sp.TAddress).open_some()

    @sp.entry_point
    def default(self, unit):
        """Default entrypoint that allows receiving tez transfers in the same
        way as one would do with a normal tz wallet.

        This is mostly used to redirect staking rewards or donations to the
        contract administrator deposit.

        """
        # Define the input parameter data type
        sp.set_type(unit, sp.TUnit)

        # Move the transferred tez amount to the contract administrator deposit
        self.data.deposits[self.data.administrator] = self.get_deposit(
            self.data.administrator) + sp.amount

    @sp.entry_point
    def set_delegate(self, baker):
        """Delegates the tez stored in the contract to the given baker.

        """
        # Define the input parameter data type
        sp.set_type(baker, sp.TOption(sp.TKeyHash))

        # Check that the administrator executed the entry point
        self.check_is_administrator()

        # Set the new delegate
        sp.set_delegate(baker)

    @sp.entry_point
    def transfer_to_deposit(self, unit):
        """Transfers some mutez to the sender deposit.

        """
        # Define the input parameter data type
        sp.set_type(unit, sp.TUnit)

        # Add the transferred amount to the sender deposit
        self.data.deposits[sp.sender] = self.get_deposit(sp.sender) + sp.amount

    @sp.entry_point
    def withdraw_from_deposit(self, amount):
        """Withdraws a given amount of mutez from the sender deposit.

        """
        # Define the input parameter data type
        sp.set_type(amount, sp.TMutez)

        # Check that no tez have been transferred
        self.check_no_tez_transfer()

        # Check that the amount to withdraw is larger than zero
        sp.verify(amount > sp.mutez(0), message="HFEE_WRONG_TEZ_AMOUNT")

        # Check that the sender deposit has enough funds
        deposit = sp.compute(self.get_deposit(sp.sender))
        sp.verify(deposit >= amount, message="HFEE_INSUFFICIENT_TEZ_BALANCE")

        # Remove the amount from the sender deposit
        self.data.deposits[sp.sender] = deposit - amount

        # Transfer the tez amount to the sender
        sp.send(sp.sender, amount)

    @sp.entry_point
    def add_fee(self, params):
        """Adds the Harberger fee information for a new token.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            token_id=sp.TNat,
            fee_information=HarbergerFee.TOKEN_FEE_TYPE).layout(
                ("token_id", "fee_information")))

        # Check that the token contract executed the entry point
        self.check_is_token_contract()

        # Check that the fee does not exceed 100%
        sp.verify(params.fee_information.fee <= 1000,
                  message="HFEE_INVALID_FEE")

        # Add the fee information
        self.data.fees[params.token_id] = params.fee_information

    @sp.entry_point
    def token_approval(self, params):
        """The user approves or disapproves to pay fees for the given token.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            token_id=sp.TNat,
            approval=sp.TBool).layout(
                ("token_id", "approval")))

        # Check that no tez have been transferred
        self.check_no_tez_transfer()

        # Add or remove the token approval
        with sp.if_(params.approval):
            self.data.approved_tokens[(sp.sender, params.token_id)] = sp.unit
        with sp.else_():
            del self.data.approved_tokens[(sp.sender, params.token_id)]

    @sp.entry_point
    def set_price(self, params):
        """Sets a new price for the token.

        Only the token owner can execute this entry point.
        Before updating the price all remaining fees need to be paid.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            token_id=sp.TNat,
            price=sp.TMutez).layout(
                ("token_id", "price")))

        # Check that no tez have been transferred
        self.check_no_tez_transfer()

        # Check that the token exists
        self.check_token_exists(params.token_id)

        # Check that the token is not on auction
        fee_information = sp.compute(self.data.fees[params.token_id])
        sp.verify(~fee_information.auction, message="HFEE_TOKEN_ON_AUCTION")

        # Check that the sender is the token owner
        sp.verify(sp.sender == self.get_token_owner(params.token_id),
                  message="HFEE_SENDER_IS_NOT_OWNER")

        # Charge the fee if the owner is not the fee recipient, since the fee
        # recipient never pays fees
        with sp.if_(sp.sender != fee_information.recipient):
            # Check that the owner approved to pay the token fees
            self.check_token_is_approved(sp.sender, params.token_id)

            # Calculate the fee amount to pay for the new price
            fee_amount = sp.local("fee_amount",
                sp.split_tokens(params.price, fee_information.fee, 1000))

            # Calculate the remaining fee amount from the old price
            montly_payment = sp.split_tokens(
                fee_information.price, fee_information.fee, 1000)
            remaining_fee = sp.compute(sp.split_tokens(
                montly_payment, abs(sp.now - fee_information.next_payment),
                HarbergerFee.FEE_PERIOD_IN_SECONDS))

            # Combine the two fee amounts
            with sp.if_(sp.now < fee_information.next_payment):
                # Subtract the fee amount that was paid in advance
                with sp.if_(fee_amount.value > remaining_fee):
                    fee_amount.value -= remaining_fee
                with sp.else_():
                    fee_amount.value = sp.mutez(0)
            with sp.else_():
                # Add the two fee amounts together
                fee_amount.value += remaining_fee

            # Check if there is some fee to pay
            with sp.if_(fee_amount.value > sp.mutez(0)):
                # Check that the owner has enough tez in their deposit to pay
                # the fee
                deposit = sp.compute(self.get_deposit(sp.sender))
                sp.verify(deposit >= fee_amount.value,
                          message="HFEE_INSUFFICIENT_TEZ_BALANCE")

                # Subtract the fee amount from the owner deposit
                self.data.deposits[sp.sender] = deposit - fee_amount.value

                # Send the fee to the fee recipient
                sp.send(fee_information.recipient, fee_amount.value)

        # Update the fee information
        self.data.fees[params.token_id] = sp.record(
            price=params.price,
            fee=fee_information.fee,
            recipient=fee_information.recipient,
            next_payment=sp.now.add_seconds(HarbergerFee.FEE_PERIOD_IN_SECONDS),
            auction=False)

    @sp.entry_point
    def pay_fees(self, params):
        """Pays the fees associated to a given token.

        Any user can pay the fees of a given token. They don't need to be the
        token owner.

        This is necessary when the token is transferred to a contract that
        might not have a way to pay the fees.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            token_id=sp.TNat,
            months=sp.TNat).layout(
                ("token_id", "months")))

        # Check that no tez have been transferred
        self.check_no_tez_transfer()

        # Check that the token exists
        self.check_token_exists(params.token_id)

        # Check that the token is not on auction
        fee_information = sp.compute(self.data.fees[params.token_id])
        sp.verify(~fee_information.auction, message="HFEE_TOKEN_ON_AUCTION")

        # Check that the fee recipient is not the current token owner, since
        # the fee recipient never pays fees
        token_owner = self.get_token_owner(params.token_id)
        sp.verify(fee_information.recipient != token_owner,
                  message="HFEE_OWNER_IS_FEE_RECIPIENT")

        # Check that the sender approved to pay the token fees
        self.check_token_is_approved(sp.sender, params.token_id)

        # Calculate the amount of fees to pay
        fee_amount = sp.compute(sp.mul(params.months, sp.split_tokens(
            fee_information.price, fee_information.fee, 1000)))

        # Check if there is some fee to pay
        with sp.if_(fee_amount > sp.mutez(0)):
            # Check that the sender has enough tez in their deposit to pay
            deposit = sp.compute(self.get_deposit(sp.sender))
            sp.verify(deposit >= fee_amount,
                      message="HFEE_INSUFFICIENT_TEZ_BALANCE")

            # Subtract the fee amount from the sender deposit
            self.data.deposits[sp.sender] = deposit - fee_amount

            # Send the fee amount to the fee recipient
            sp.send(fee_information.recipient, fee_amount)

        # Update the deadline for the next payment
        self.data.fees[params.token_id].next_payment = fee_information.next_payment.add_seconds(
            sp.to_int(params.months * HarbergerFee.FEE_PERIOD_IN_SECONDS))

    @sp.entry_point
    def apply_fees(self, token_id):
        """Applies the fees associated to a given token.

        Anyone can call this entrypoint.

        If the owner does not have enough tez in their deposit to pay the fees,
        the token is put on sale using a Dutch auction.

        """
        # Define the input parameter data type
        sp.set_type(token_id, sp.TNat)

        # Check that no tez have been transferred
        self.check_no_tez_transfer()

        # Check that the token exists
        self.check_token_exists(token_id)

        # Check that the token is not on auction
        fee_information = sp.compute(self.data.fees[token_id])
        sp.verify(~fee_information.auction, message="HFEE_TOKEN_ON_AUCTION")

        # Check that the fee recipient is not the current token owner, since
        # the fee recipient never pays fees
        token_owner = sp.compute(self.get_token_owner(token_id))
        sp.verify(fee_information.recipient != token_owner,
                  message="HFEE_OWNER_IS_FEE_RECIPIENT")

        # Check if the deadline to pay the fees has expired
        with sp.if_(sp.now > fee_information.next_payment):
            # Calculate the amount of fees to pay
            montly_payment = sp.split_tokens(
                fee_information.price, fee_information.fee, 1000)
            months_to_pay = sp.compute(1 + (
                sp.as_nat(sp.now - fee_information.next_payment) // HarbergerFee.FEE_PERIOD_IN_SECONDS))
            fee_amount = sp.compute(sp.mul(months_to_pay, montly_payment))

            # Check if there is some fee to pay
            with sp.if_(fee_amount > sp.mutez(0)):
                # Check if owner has enough tez in their deposit to pay the fee
                # and has accepted to pay the fees for that token
                deposit = sp.compute(self.get_deposit(token_owner))
                approved = self.data.approved_tokens.contains(
                    (token_owner, token_id))

                with sp.if_((deposit >= fee_amount) & approved):
                    # Subtract the fee amount from the owners deposit
                    self.data.deposits[token_owner] = deposit - fee_amount

                    # Send the fee amount to the fee recipient
                    sp.send(fee_information.recipient, fee_amount)

                    # Update the deadline for the next payment
                    self.data.fees[token_id].next_payment = fee_information.next_payment.add_seconds(
                        sp.to_int(months_to_pay * HarbergerFee.FEE_PERIOD_IN_SECONDS))
                with sp.else_():
                    with sp.if_((deposit > sp.mutez(0)) & approved):
                        # Send whatever is available in the owner deposit to the
                        # fee recipient
                        sp.send(fee_information.recipient, deposit)

                        # Set the token owner deposit to zero
                        self.data.deposits[token_owner] = sp.mutez(0)

                    # Put the token on auction
                    self.data.fees[token_id] = sp.record(
                        price=fee_information.price,
                        fee=fee_information.fee,
                        recipient=fee_information.recipient,
                        next_payment=sp.now,
                        auction=True)

    @sp.entry_point
    def collect(self, params):
        """Collects a given token and sets a new price for it.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            token_id=sp.TNat,
            price=sp.TMutez).layout(
                ("token_id", "price")))

        # Check that the token exists
        self.check_token_exists(params.token_id)

        # Calculate the token price
        fee_information = sp.compute(self.data.fees[params.token_id])
        current_price = sp.local("current_price", fee_information.price)

        with sp.if_(fee_information.auction):
            # Auctions last 10 days before the price is set to zero
            running_days = sp.as_nat(
                (sp.now - fee_information.next_payment)) // (3600 * 24)
            price_reduction = sp.compute(sp.split_tokens(
                current_price.value, running_days, 10))

            with sp.if_(price_reduction < current_price.value):
                current_price.value -= price_reduction
            with sp.else_():
                current_price.value = sp.mutez(0)

        # Check that the provided tez amount is exactly the current token price
        sp.verify(sp.amount == current_price.value,
                  message="HFEE_WRONG_TEZ_AMOUNT")

        # Send the tez amount to the previous owner if they approved to pay the
        # token fees before, otherwise send it to the fees recipient
        token_owner = sp.compute(self.get_token_owner(params.token_id))
        approved = self.data.approved_tokens.contains(
            (token_owner, params.token_id))

        with sp.if_(sp.amount > sp.mutez(0)):
            with sp.if_(approved):
                sp.send(token_owner, sp.amount)
            with sp.else_():
                sp.send(fee_information.recipient, sp.amount)

        # Calculate the fee amount to pay for the new price
        fee_amount = sp.compute(
            sp.split_tokens(params.price, fee_information.fee, 1000))

        # Check if there is some fee to pay
        with sp.if_(fee_amount > sp.mutez(0)):
            # Check that the sender has enough tez in their deposit to pay
            deposit = sp.compute(self.get_deposit(sp.sender))
            sp.verify(deposit >= fee_amount,
                      message="HFEE_INSUFFICIENT_TEZ_BALANCE")

            # Subtract the fee amount from the sender deposit
            self.data.deposits[sp.sender] = deposit - fee_amount

            # Send the fee amount to the fee recipient
            sp.send(fee_information.recipient, fee_amount)

        # Update the fee information
        self.data.fees[params.token_id] = sp.record(
            price=params.price,
            fee=fee_information.fee,
            recipient=fee_information.recipient,
            next_payment=sp.now.add_seconds(HarbergerFee.FEE_PERIOD_IN_SECONDS),
            auction=False)

        # Approve to pay the fees for this token and remove the previous owner
        # approval
        self.data.approved_tokens[(sp.sender, params.token_id)] = sp.unit
        del self.data.approved_tokens[(token_owner, params.token_id)]

        # Transfer the token to the sender, so it becomes the new owner
        transfer_handle = sp.contract(
            t=sp.TList(sp.TRecord(
                from_=sp.TAddress,
                txs=sp.TList(sp.TRecord(
                    to_=sp.TAddress,
                    token_id=sp.TNat,
                    amount=sp.TNat).layout(("to_", ("token_id", "amount")))))),
            address=self.data.token_contract,
            entry_point="transfer").open_some()
        sp.transfer(
            arg=sp.list([sp.record(
                from_=token_owner,
                txs=sp.list([sp.record(
                    to_=sp.sender,
                    token_id=params.token_id,
                    amount=1)]))]),
            amount=sp.mutez(0),
            destination=transfer_handle)

    @sp.entry_point
    def transfer_administrator(self, proposed_administrator):
        """Proposes to transfer the contract administrator to another address.

        """
        # Define the input parameter data type
        sp.set_type(proposed_administrator, sp.TAddress)

        # Check that the administrator executed the entry point
        self.check_is_administrator()

        # Set the new proposed administrator address
        self.data.proposed_administrator = sp.some(proposed_administrator)

    @sp.entry_point
    def accept_administrator(self):
        """The proposed administrator accepts the contract administrator
        responsibilities.

        """
        # Check that the proposed administrator executed the entry point
        sp.verify(sp.sender == self.data.proposed_administrator.open_some(
            message="HFEE_NO_NEW_ADMIN"), message="HFEE_NOT_PROPOSED_ADMIN")

        # Set the new administrator address
        self.data.administrator = sp.sender

        # Reset the proposed administrator value
        self.data.proposed_administrator = sp.none

    @sp.entry_point
    def set_metadata(self, params):
        """Updates the contract metadata.

        """
        # Define the input parameter data type
        sp.set_type(params, sp.TRecord(
            k=sp.TString,
            v=sp.TBytes).layout(("k", "v")))

        # Check that the administrator executed the entry point
        self.check_is_administrator()

        # Update the contract metadata
        self.data.metadata[params.k] = params.v

    @sp.entry_point
    def set_delegate(self, baker):
        """Delegates the tez stored in the contract to the given baker.
        """
        # Define the input parameter data type
        sp.set_type(baker, sp.TOption(sp.TKeyHash))

        # Check that the administrator executed the entry point
        self.check_is_administrator()

        # Set the new delegate
        sp.set_delegate(baker)

sp.add_compilation_target("harbergerFee", HarbergerFee(
    administrator=sp.address("tz1M9CMEtsXm3QxA7FmMU2Qh7xzsuGXVbcDr"),
    metadata=sp.utils.metadata_of_url("ipfs://bbb"),
    token_contract=sp.address("KT1M9CMEtsXm3QxA7FmMU2Qh7xzsuGXVbcDr")))

@sp.add_test(name="Fees")
def test():
    sc = sp.test_scenario()
    sc.table_of_contents()
    sc.h1("Accounts")
    sc.show(["tz1M9CMEtsXm3QxA7FmMU2Qh7xzsuGXVbcDr"])
    sc.h2("harberger fees")
    c1 = HarbergerFee(
      administrator=sp.address("tz1LDai7f4GngahX7bBBSyvEzkC4aKNUYscZ"),
      metadata=sp.utils.metadata_of_url("ipfs://QmYXJv8yTtDQKLZeChitD8tkUhwWK4qMPnvtnG48dXeqPU"),
      token_contract=sp.address("KT19cV5DxM23cb57dfJZuuddnT5moiLWrPdh")
    )

    sc += c1    
    