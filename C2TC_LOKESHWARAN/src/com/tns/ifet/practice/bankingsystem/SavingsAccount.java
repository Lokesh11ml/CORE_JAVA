package com.tns.ifet.practice.bankingsystem;

//SavingsAccount.java
public class SavingsAccount extends Account {
 private static final double INTEREST_RATE = 0.03; // 3% interest rate

 public SavingsAccount(String accountHolder, double initialDeposit) {
     super(accountHolder, initialDeposit);
 }

 @Override
 public void deposit(double amount) {
     if (amount > 0) {
         balance += amount;
         System.out.println("Deposited " + amount + " into Savings Account. New balance: " + balance);
     } else {
         System.out.println("Invalid deposit amount.");
     }
 }

 @Override
 public void withdraw(double amount) {
     if (amount > 0 && amount <= balance) {
         balance -= amount;
         System.out.println("Withdrew " + amount + " from Savings Account. New balance: " + balance);
     } else {
         System.out.println("Invalid or insufficient funds in Savings Account.");
     }
 }

 @Override
 public double getBalance() {
     return balance + (balance * INTEREST_RATE);
 }
}

