/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).


% Signature: path(Node1, Node2, Path)/3
% Purpose: Path is a path, denoted by a list of nodes, from Node1 to Node2.
path(X, Y, [X, Y]):- edge(X, Y). 
path(X, Y, [X | Ns]):- edge(X, Z), path(Z, Y, Ns).

% Signature: cycleNode, Cycle/2
% Purpose: Cycle is a cyclic path, denoted a list of nodes, from Node1 to Node1.
cycle(Node, Cycle):- path(Node, Node, Cycle).


% Signature: reverse(Graph1,Graph2)/2
% Purpose: The edges in Graph1 are reversed in Graph2
reverse(Graph1, Graph2):- reverse_left(Graph1, Graph2), reverse_right(Graph1, Graph2).

reverse_left([], _).
reverse_left([[X,Y] | E1s], Graph2):- member([Y, X], Graph2), reverse_left(E1s, Graph2).
reverse_right(_, []).
reverse_right(Graph1, [[X, Y]| E2s]):- member([Y, X], Graph1), reverse_right(Graph1, E2s).


% Signature: degree(Node, Graph, Degree)/3
% Purpose: Degree is the degree of node Node, denoted by a Church number (as defined in class)
% Signature: degree(Node, Graph, Degree)/3
% Purpose: Degree is the degree of node Node, denoted by a Church number (as defined in class)
degree(_, [], zero).
degree(A, [[A, _]|Es], s(D)):- degree(A, Es, D).
degree(A, [[X, _]|Es], D):- not(A == X), degree(A, Es, D).


edge(a,b).
edge(a,c).
edge(c,b).
edge(c,a).