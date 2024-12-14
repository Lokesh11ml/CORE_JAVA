package com.lokeshwaran.assignment1.utilities;
import com.lokeshwaran.assignment1.employee.*;
public class EmployeeUtilities {
	public static void printEmployeeDetails(employee employee) {
		 System.out.println("Employee Name: " + employee.getName());
		 System.out.println("Employee ID: " + employee.getEmployeeId());
		 System.out.println("Salary: " + employee.getSalary());
		 if (employee instanceof manager) {
			 manager manager = (manager) employee;
			 System.out.println("Department: " + manager.getDepartment());
		 } else if (employee instanceof developer) {
			 developer developer = (developer) employee;
			 System.out.println("Programming Language: " + developer.getProgrammingLanguage());
		 }
		 System.out.println();
	}
}
