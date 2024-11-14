package com.tns.ifet.practice.bankingsystem;

//Account.java
public abstract class Account {
 protected String accountHolder;
 protected double balance;

 // Constructor for initializing account holder and balance
 public Account(String accountHolder, double initialDeposit) {
     this.accountHolder = accountHolder;
     this.balance = initialDeposit;
 }

 // Abstract methods for account operations
 public abstract void deposit(double amount);
 public abstract void withdraw(double amount);
 public abstract double getBalance();

 // Concrete method for displaying account information
 public void displayAccountInfo() {
     System.out.println("Account Holder: " + accountHolder);
     System.out.println("Current Balance: " + balance);
 }
}

