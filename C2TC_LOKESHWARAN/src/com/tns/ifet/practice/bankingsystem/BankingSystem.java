package com.tns.ifet.practice.bankingsystem;

//BankingSystem.java
public class BankingSystem {
 public static void main(String[] args) {
     // Creating a SavingsAccount and a CheckingAccount
     SavingsAccount savings = new SavingsAccount("Alice", 1000);
     CheckingAccount checking = new CheckingAccount("Bob", 500);

     // Displaying account information and performing operations
     System.out.println("Savings Account:");
     savings.displayAccountInfo();
     savings.deposit(200);
     savings.withdraw(100);
     System.out.println("Savings Account Balance with Interest: " + savings.getBalance());

     System.out.println();

     System.out.println("Checking Account:");
     checking.displayAccountInfo();
     checking.deposit(300);
     checking.withdraw(1000); // Exceeds initial balance but within overdraft limit
     System.out.println("Checking Account Balance: " + checking.getBalance());
 }
}

