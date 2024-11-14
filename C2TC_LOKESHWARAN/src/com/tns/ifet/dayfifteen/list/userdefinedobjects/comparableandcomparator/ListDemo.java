//Program to demonstrate List collection for user defined objects and 
//sort elements using comparable and comparator
package com.tns.ifet.dayfifteen.list.userdefinedobjects.comparableandcomparator;

import java.util.ArrayList;
import java.util.Collections;

import java.util.List;


class Point implements Comparable<Point> {
    float x, y;

    // Constructor
    Point(float x, float y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public int compareTo(Point p) {
        return Float.compare(this.x, p.x); // Ascending order by x-coordinate
    }

    @Override
    public String toString() {
        return "Point [x=" + x + ", y=" + y + "]";
    }
}

public class ListDemo {

    public static void main(String[] args) {
        // Adding Point objects to ArrayList
        List<Point> pList = new ArrayList<Point>();
        pList.add(new Point(12, 4.5f));
        pList.add(new Point(10, 20));
        // Sorting Points by x-coordinate
        Collections.sort(pList);
        System.out.println("Sorted Points by x-coordinate: " + pList);

        // Adding Student objects to ArrayList
        List<Student> studentList = new ArrayList<Student>();
        studentList.add(new Student(11, "Pooja", 78));
        studentList.add(new Student(21, "Nikita", 85));
        studentList.add(new Student(13, "Deepa", 68));
        studentList.add(new Student(41, "Neha", 72));

        System.out.println("---------------Student Details Before Sorting-------------------");
        System.out.println(studentList);

        Collections.sort(studentList); // Using Comparable for sorting

        System.out.println("---------------Student Details After Sorting-------------------");
        System.out.println(studentList);

        // Adding Person objects to ArrayList
        List<Person> personList = new ArrayList<Person>();
        personList.add(new Person("Abhijit", "Mumbai"));
        personList.add(new Person("Milind", "Pune"));
        personList.add(new Person("Saurav", "Bangalore"));
        personList.add(new Person("Madhur", "Delhi"));

        System.out.println("---------------Person Details Before Sorting-------------------");
        System.out.println(personList);

        Collections.sort(personList, new SortByName());
        System.out.println("---------------Person Details After Sorting by Name -------------------");
        System.out.println(personList);

        Collections.sort(personList, new SortByCity());
        System.out.println("---------------Person Details After Sorting by City -------------------");
        System.out.println(personList);
    }
}