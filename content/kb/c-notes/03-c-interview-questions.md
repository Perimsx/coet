---
title: "关于整数类型存储的面试问题"
date: "2026-06-16"
category: "c-notes"
description: "三道C语言经典面试题：整数存储、类型转换与指针运算"
---


## 关于整数类型存储的面试问题

以下三个问题大家可以先独立思考一下，看看如果真的面试官问你，你能不能正确的回答并清晰的讲出其中的原理。

###  

### 问题 1

请问，printf 函数会打印出什么内容？并解释原因。

```
char a = -1;
signed char b = -1; 
unsigned char c = -1; 
printf("a = %d, b = %d, c = %d\n", a, b, c);
```



```
a = -1, b = -1, c = 255
```



![img](/static/c/c-aHR0cHM6Ly9pbWdj.png)



signed char 与 char 表示同一种类型，原理一样



![img](/static/c/c-aHR0cHM6Ly9pbWdj.png)



###  

### 问题 2

请问，printf 函数会打印出什么内容？并解释原因。

```
char a = -128; printf("%u\n", a);
```



```
4294967168
```



你想到了吗？



我们还是按照上面的思路分析：

![img](/static/c/c-aHR0cHM6Ly9pbWdj.png)



###  

### 问题 3

请问，printf 函数会打印出什么内容？并解释原因。

```
char a = 128; printf("%u\n", a);
```



```
4294967168
```



神奇吗？并不神奇。

原因就在于“截断”时得到的二进制序列是一模一样的，后面的操做是相同的。

另外说一句，char 的范围是 -128 ~ 127，所以上面的 char 型变量 a 溢出了。



试着想想下面的 printf 函数又会输出什么呢？

```
unsigned char a = -128; 
unsigned char b = 128; 
printf("a = %u, b = %u\n", a, b);
```



### 推荐阅读：

[给你三个必须要学C语言的理由！](https://blog.csdn.net/qq_44954010/article/details/104334319)