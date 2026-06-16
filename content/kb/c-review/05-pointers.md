---
title: "指针基础与二级指针"
date: "2026-06-16"
category: "c-review"
description: "指针的概念、指针运算、二级指针与指针与数组的关系"
---


这一节带大家简单了解一下与指针，希望对大家有帮助

------



# 指针

## 1.什么是指针？

> 在计算机科学中，指针（Pointer）是编程语言中的一个对象，利用地址，它的值直接指向 （points to）存在电脑存储器中另一个地方的值。由于通过地址能找到所需的变量单元，可以说，地址指向该变量单元。因此，将地址形象化的称为“指针”。意思是通过它能找到以它为地址 的内存单元。



### 指针的大小：

1.指针是用来存放地址的，地址是唯一标示一块地址空间的。

2.**指针的大小在32位平台是4个字节，在64位平台是8个字节。**

### 指针类型：

> char *p = NULL;
>
> short *p = NULL;
>
> int *p = NULL;
>
> long *p = NULL;
>
> double *p = NULL;
>
> .......



![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

null 是什么我后面会解释给大家 

既然指针大小已经固定的，那么要这么多指针类型有什么用呢？或者说我们可不可以有char*来表示所有的指针类型？

## 指针类型的作用

### 1.指针的类型决定了指针向前或者向后走一步有多大 

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 可以看到：字符指针加一只增加了一个字节；而整型指针增加了四个字节

​          （char*）为强制类型转换 因为n是整型所以n的指针应该是int*

### 2.指针的类型决定了，对指针解引用的时候有多大的权限（能操作几个字节）。

比如： char* 的 指针解引用就只能访问一个字节，而 int* 的指针的解引用就能访问四个字节。

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 0x11223344是16进制数 16进制数一位就是四个二进制位 

所以16进制数 每两位就代表一个字节 

所以地址一般有16进制位表示 也就是四个字节

## 野指针

> 概念： 野指针就是指针指向的位置是不可知的（随机的、不正确的、没有明确限制的）指针变量 在定义时如果未初始化，其值是随机的，指针变量的值是别的变量的地址，意味着指针指向了一 个地址是不确定的变量，此时去解引用就是去访问了一个不确定的地址，所以结果是不可知的。

### 1.野指针成因

**1.指针未初始化**

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

**2. 指针越界访问**

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

**3. 指针指向的空间释放**
 举个简单例子

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 test被调用完之后临时变量a已经被释放，所以*p就是野指针。

动态空间开辟会详细讲。

> **如何规避野指针** 
> \1. 指针初始化
>
> \2. 小心指针越界
>
> \3. 指针指向空间释放即使置NULL
>
> \4. 指针使用之前检查有效性

 防止指针为初始化我们可以这样做：

```
#include <stdio.h> 
	int main() { 
		int *p = NULL;//NULL 值为0 
		int a = 10;
		p = &a;
		if (p != NULL)//如果p为NUL说明指针p没有经过初始化
		{
			*p = 20;
		}
		return 0; 
	}
```



## 指针运算

### 1.指针+-整数

```
eg:
double arr[5] = {1.1,2,3,4,5};
double * p = arr;
for(p = &arr[0];p<&arr[5];)
    *(p++) = 0;
```



### 2.指针减指针

这里介绍strlen实现：

方法1：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

方法2：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 方法3：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

方法4：

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

我们来看一下vs strlen库函数是如何写的，它的路径如下： 

```
size_t __cdecl strlen (
        const char * str
        )
{
        const char *eos = str;

        while( *eos++ ) ;

        return( eos - str - 1 );
```



是不是和方法4差不多呀

### 3.指针关系运算

以初始化数组为例

方法1：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

方法2：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

实际在绝大部分的编译器上是可以顺利完成任务的，然而我们还是应该避免这样写，因为标准并不保证 它可行。

大家可以根据上面的例子细品一下这句话：

> 标准规定：
> 允许指向数组元素的指针与指向数组最后一个元素后面的那个内存位置的指针比较，但是不允许 与指向第一个元素之前的那个内存位置的指针进行比较。

## 二级指针

##  ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

## 指针数组

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

例1： 

##  ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

12 = 3*4（指针大小） 

例2：

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

练习：

1：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

2：

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

