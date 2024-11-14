package com.tns.ifet.practice.bankingsystem;

//CheckingAccount.java
public class CheckingAccount extends Account {
 private static final double OVERDRAFT_LIMIT = 500; // Allow overdraft up to $500

 public CheckingAccount(String accountHolder, double initialDeposit) {
     super(accountHolder, initialDeposit);
 }

 @Override
 public void deposit(double amount) {
     if (amount > 0) {
         balance += amount;
         System.out.println("Deposited " + amount + " into Checking Account. New balance: " + balance);
     } else {
         System.out.println("Invalid deposit amount.");
     }
 }

 @Override
 public void withdraw(double amount) {
     if (amount > 0 && (balance + OVERDRAFT_LIMIT) >= amount) {
         balance -= amount;
         System.out.println("Withdrew " + amount + " from Checking Account. New balance: " + balance);
     } else {
         System.out.println("Withdrawal amount exceeds overdraft limit.");
     }
 }

 @Override
 public double getBalance() {
     return balance;
 }
}

