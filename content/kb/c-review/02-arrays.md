---
title: "数组与操作符基础"
date: "2026-06-16"
category: "c-review"
description: "数组、操作符、关键字、typedef、static、define综合复习"
---


## 数组

### 1.数组的赋值 

int arr[10]={1,2}的意义为将数组arr前2个元素初始化为1，2后面的元素初始化为0。

![数组调试](/static/c/c-aHR0cHM6Ly9pbWct.png)



------



## 操作符

### 1.算数操作符

> \+   -   *   /   %

" / "除法运算 向下取整

" % "求余运算 计算余数

### 2.移位操作符

> \>>   <<

\>> 左移 << 右移 表示2进制位左移右移 

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

为方便理解，可以参考下图： 

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

### 3.位操作符

> &   |   ^

a.按位与

与的原理等同于数学中的且

按位就是按照变量的2进制位 

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

b.按位或

101 5

011 3

111 7

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

c.按位异或

101 5

011 3

110 6

 ![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

### 赋值操作符

> ###  =  +=  -=  *=  /=  &=  ^=  |=  >>=   <<= 

###  单目操作符

> ！ 逻辑反操作
>
> \-  负值
>
> \+  正值
>
> &  取地址
>
> sizeof()  操作数的类型长度（以字节为单位） 
>
> ++
>
> \--
>
> \*   间接访问操作符(解引用操作符) 
>
> (类型)  强制类型转换
>
> ~   对一个数的二进制按位取反 

###  关系操作符

> \>  >=   <   <=  !=  ==(不要写成=)

### 逻辑操作符

> &&  || 

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

### 条件操作符

> exp1 ? exp2 : exp3

###  逗号表达式

> exp1, exp2, exp3, …expN

从左到右依次计算，最终值等于最后一个表达式 

###  下标引用、函数调用和结构成员

> []   ()  .   ->

##  常见关键字

> auto  break  case  char  const  continue  default  do  double else  enum  exte
>
> rn float  for  goto  if  int  long  register return  short  signed  sizeof  static struct  switch  typedef union  unsigned  void  volatile  while

###  1.typedef

类型重命名

```c
//将unsigned int 重命名为uint_32, 所以uint_32也是一个类型名
typedef unsigned int uint_32;

int main() {
    //观察num1和num2,这两个变量的类型是一样的    
    unsigned int num1 = 0;    
    uint_32 num2 = 0;    
    return 0; 

} 
```



### 2.static

```c
//代码1 
#include <stdio.h> 
void test() {    
    int i = 0;    
    i++;    
    printf("%d ", i);
} 
int main() {    
    int i = 0;  
    for(i=0; i<10; i++){
        test();    
    }    
return 0; 
} 
//代码2 
#include <stdio.h> 
void test() {    
//static修饰局部变量    
    static int i = 0;   
    i++;    
    printf("%d ", i);
} 
int main(){    
    int i = 0;   
    for(i=0; i<10; i++){        
        test();    
    }    
return 0; 
}
```



代码1 中会输出十个2。而代码2种则会输出0~9

------

 关于static 的思考

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

对于静态变量的声明应该在static语句中声明



a）*一个全局变量被static修饰，使得这个全局变量只能在本源文件内使用，不能在其他源文件内使用。
extern int a （所要执行的源文件内声明）*

*static int a （包含a的源文件内声明）*

b）*一个函数被static修饰，使得这个函数只能在本源文件内使用，不能在其他源文件内使用*。
extern int add(int x,int y)

### 3.define定义的常量和宏

```
#define MAX 100//定义常量
#define Add(x,y) (x+y)//定义函数
#define Max(x,y) (x>y?x:y)
```



## 指针

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

 指针变量也需要地址存放。

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

*结论：指针大小在32位平台是4个字节，64位平台是8个字节。* 

*printf("%p\n", p) 输出地址*

## 结构体 

![img](/static/c/c-aHR0cHM6Ly9pbWct.png)

