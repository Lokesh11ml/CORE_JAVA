package com.lokeshwaran.assignment1;
import com.lokeshwaran.assignment1.employee.*;
import com.lokeshwaran.assignment1.utilities.EmployeeUtilities;
public class AssignmentMain {
	public static void main(String[] args) {
		 manager manager = new manager("John", 101, 90000, "Sales");
		 developer developer = new developer("Alice", 102, 80000, "Java");
		 EmployeeUtilities.printEmployeeDetails(manager);
		 EmployeeUtilities.printEmployeeDetails(developer);
		 }
}
